"""Printable A5 review invitation. Generates the QR directly from the verified Place ID."""
from pathlib import Path
import re
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A5
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
import reportlab
font_dir=Path(reportlab.__file__).parent/'fonts'
pdfmetrics.registerFont(TTFont('Review',str(font_dir/'Vera.ttf')))
pdfmetrics.registerFont(TTFont('ReviewBold',str(font_dir/'VeraBd.ttf')))
place=re.search(r"GOOGLE_PLACE_ID='([^']+)'",Path('lib/site-info.ts').read_text(encoding='utf-8')).group(1)
url='https://search.google.com/local/writereview?placeid='+place
out=Path('public/qr-opiniones-google.pdf');w,h=A5
c=canvas.Canvas(str(out),pagesize=A5);c.setTitle('Dejanos tu opinión en Google — Disfraz Cabezón');c.setAuthor('Disfraz Cabezón')
c.setFillColor(HexColor('#7750aa'));c.roundRect(20,20,w-40,h-40,16,stroke=0,fill=1)
c.setFillColorRGB(1,1,1);c.roundRect(23,23,w-46,h-46,14,stroke=0,fill=1)
c.drawImage('public/brand-normal-320.png',w/2-48,h-132,width=96,height=96,preserveAspectRatio=True,anchor='c',mask='auto')
c.setFillColor(HexColor('#242128'));c.setFont('ReviewBold',26);c.drawCentredString(w/2,h-171,'¿Te gustó?')
c.setFont('ReviewBold',17);c.drawCentredString(w/2,h-201,'Dejanos tu opinión en Google')
qr=QrCodeWidget(url,barLevel='M',barBorder=4);x0,y0,x1,y1=qr.getBounds();size=232
drawing=Drawing(size,size,transform=[size/(x1-x0),0,0,size/(y1-y0),0,0]);drawing.add(qr)
renderPDF.draw(drawing,c,(w-size)/2,119)
c.linkURL(url,(w/2-size/2,119,w/2+size/2,119+size),relative=0,thickness=0)
c.setFont('Review',10);c.setFillColor(HexColor('#726d78'));c.drawCentredString(w/2,94,'Escaneá el QR con la cámara del celular')
c.setFont('ReviewBold',11);c.setFillColor(HexColor('#7750aa'));c.drawCentredString(w/2,66,'Disfraz Cabezón')
c.setFont('Review',9);c.drawCentredString(w/2,49,'Av. Rivadavia 3314 · CABA')
c.save();print(str(out)+' — A5, QR '+url)
