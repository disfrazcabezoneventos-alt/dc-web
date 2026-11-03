"""Update text only in the original styled contract. Requires pypdf and reportlab."""
import io,json,os
from pathlib import Path
from pypdf import PdfReader,PdfWriter
from pypdf.generic import ContentStream,NameObject
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
import reportlab
from xml.sax.saxutils import escape

data=json.loads(Path('tmp/pdfs/terms.json').read_text(encoding='utf-8'))
reader=PdfReader('tmp/pdfs/contrato-diseno-original.pdf'); writer=PdfWriter()
# Bitstream Vera has the original DejaVu Sans metrics and supports accents, enie, smart quotes and em dashes.
font_dir=Path(reportlab.__file__).parent/'fonts'
pdfmetrics.registerFont(TTFont('ContractSans',str(font_dir/'Vera.ttf')))
pdfmetrics.registerFont(TTFont('ContractBold',str(font_dir/'VeraBd.ttf')))
for token in ['ñ','á','é','í','ó','ú','“','”','—']:
    assert ord(token) in pdfmetrics.getFont('ContractSans').face.charToGlyph,token
purple=HexColor('#76519b'); grey=HexColor('#67717c'); ink=HexColor('#263039')

def strip_text(page,index):
    stream=ContentStream(page['/Contents'],reader); result=[]; group=None
    for args,op in stream.operations:
        if op==b'BT': group=[(args,op)];continue
        if group is not None:
            group.append((args,op))
            if op==b'ET':
                text=' '.join(str(a) for a,o in group if o in [b'Tj',b'TJ'])
                remove='09.10.2026' in text
                if index==0:remove=remove or 'Trajes y fechas acordados' in text or 'Precio del alquiler acordado' in text or 'separado' in text
                if index==1:remove=remove or 'Una contrataci' in text or 'El pago del 100%' in text or '05 Saldo de reservas' in text
                if index==2:remove=remove or 'El importe denominado' in text
                if not remove:result.extend(group)
                group=None
        else:result.append((args,op))
    assert group is None
    stream.operations=result;page[NameObject('/Contents')]=stream

def label(c,text,x,top,size=8.8,font='ContractSans',color=grey):
    c.setFont(font,size);c.setFillColor(color);c.drawString(x,841.8898-top-size*.78,text)

def paragraph(c,text,top,bottom,size=10.4):
    style=ParagraphStyle('body',fontName='ContractSans',fontSize=size,leading=13.6,textColor=ink)
    p=Paragraph(escape(text),style);w,h=p.wrap(503.2756,bottom-top)
    if h>bottom-top:raise ValueError(f'Text overflow: {h} > {bottom-top}: {text[:40]}')
    p.drawOn(c,46,841.8898-top-h)

for i,page in enumerate(reader.pages):
    strip_text(page,i);buf=io.BytesIO();c=canvas.Canvas(buf,pagesize=(595.2756,841.8898))
    label(c,'Modelo para revisión · Versión '+data['version'],46,807.8,8)
    if i==0:
        label(c,'Modelo para revisión · '+data['version'],46,159.5,10.3)
        label(c,'Trajes y fechas · alquiler y promociones',46,429.1,11.2,'ContractBold',purple)
        label(c,'Precio del alquiler calculado',56,581.8,8.5,'ContractBold')
        label(c,'Depósito de garantía — separado',56,616.8,8.5,'ContractBold')
    elif i==1:
        paragraph(c,data['terms'][3]['body'],518.7,685)
        label(c,'05 Saldo de reservas con pago parcial',46,698,11.2,'ContractBold',purple)
        paragraph(c,data['terms'][4]['body'],717,788,size=9.8)
    elif i==2:
        paragraph(c,data['terms'][6]['body'],232.7,315,size=10.1)
    c.save();buf.seek(0);page.merge_page(PdfReader(buf).pages[0]);writer.add_page(page)
writer.add_metadata({'/Title':'Contrato de alquiler — '+data['version'],'/Author':'Disfraz Cabezón'})
output=Path('public/Contrato_de_Alquiler_Disfraz_Cabezon.pdf')
with output.open('wb') as f:writer.write(f)
check=PdfReader(output);text='\n'.join(p.extract_text() for p in check.pages)
assert len(check.pages)==5
for token in ['$60.000','$75.000','$100.000','2x1','3x2','bonificados','ñ','—','“','”',data['version']]:assert token in text,token
for token in ['$65.000','Premium','09.10.2026','pago parcial no congela']:assert token not in text,token
Path('tmp/pdfs/contrato-final.txt').write_text(text,encoding='utf-8')
print('Contrato: 5 páginas originales, diseño conservado y textos verificados.')
