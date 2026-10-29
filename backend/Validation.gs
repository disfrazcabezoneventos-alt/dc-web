// Generado desde lib/model.ts, terms.ts, local-rental.ts y local-terms.ts. No editar por separado.
const BRAND = { name: 'Disfraz Cabezón', owner: 'Lorena Ughetti', cuit: '27-29478271-6', address: 'Av. Rivadavia 3314, CABA', phone: '1149897969', email: 'disfrazcabezoneventos@gmail.com' };
const OWNER_EMAIL = 'disfrazcabezoneventos@gmail.com';
const VERSION = 'DC-2026-10-09.1';
const STATUS = { pending: 'Pendiente', correction: 'A corregir', confirmed: 'Confirmado', rejected: 'Rechazado', refund_pending: 'Reintegro pendiente', refunded: 'Reintegrado', returned: 'Devuelto', incident: 'Con incidencia', cancel_requested: 'Cancelación solicitada' };
const EMPTY = { fullName: '', dni: '', birthDate: '', address: '', city: '', phone: '', altPhone: '', email: '', items: [{ name: '', category: 'adulto', quantity: 1 }], pickupDate: '', returnDate: '', pickupWindow: '', returnWindow: '', specialSchedule: false, scheduleAgreement: '', total: 0, payMode: 'half', pickupBy: 'self', authorizedName: '', authorizedDni: '', docType: 'servicio', docDate: '', namesMatch: false, adult: false, privacy: false, priorInfo: false, truth: false, terms: false, clarification: '', requestKey: '' };
const money = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
function dateAR(s) { if (!s)
    return '—'; return new Date(s.length === 10 ? s + 'T12:00:00Z' : s).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric' }); }
const phoneDigits = (s) => s.replace(/\D/g, '');
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
function todayAR() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function windows(date, kind) { if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date + 'T12:00:00Z')))
    return ''; const d = new Date(date + 'T12:00:00Z').getUTCDay(); return d === 0 ? '' : d === 6 ? '10:00 a 12:00' : kind === 'pickup' ? '16:00 a 20:00' : '10:00 a 14:00'; }
const deposit = (r) => r.items.reduce((n, i) => n + (i.category === 'adulto' ? 60000 : 100000) * i.quantity, 0);
const paid = (r) => Math.round(r.total * (r.payMode === 'full' ? 1 : 0.5) * 100) / 100;
function validate(r, step, now = todayAR()) {
    const e = {};
    const req = (k, msg) => { if (typeof r[k] !== 'string' || !r[k].trim())
        e[k] = msg; };
    if (step >= 0) {
        req('fullName', 'Ingresá tu nombre y apellido.');
        if (r.fullName?.trim().split(/\s+/).length < 2)
            e.fullName = 'Escribí nombre y apellido completos.';
        if (!/^\d{7,8}$/.test(r.dni ?? ''))
            e.dni = 'Ingresá 7 u 8 números, sin puntos.';
        req('birthDate', 'Indicá tu fecha de nacimiento.');
        if (r.birthDate) {
            const born = new Date(r.birthDate + 'T12:00:00Z');
            const t = new Date(now + 'T12:00:00Z');
            const age = t.getUTCFullYear() - born.getUTCFullYear() - ((t.getUTCMonth() < born.getUTCMonth() || (t.getUTCMonth() === born.getUTCMonth() && t.getUTCDate() < born.getUTCDate())) ? 1 : 0);
            if (!Number.isFinite(age) || age < 18 || age > 115)
                e.birthDate = 'El contratante debe tener al menos 18 años.';
        }
        req('address', 'Ingresá tu domicilio actual completo.');
        req('city', 'Ingresá localidad y provincia.');
        for (const k of ['phone', 'altPhone']) {
            const p = phoneDigits(r[k] ?? '');
            if (p.length < 10 || p.length > 15)
                e[k] = 'Ingresá código de área y número (10 a 15 dígitos).';
        }
        if (phoneDigits(r.phone ?? '').slice(-10) === phoneDigits(r.altPhone ?? '').slice(-10))
            e.altPhone = 'Usá un teléfono alternativo diferente al principal.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email ?? ''))
            e.email = 'Ingresá un correo válido.';
        if (!r.adult)
            e.adult = 'Confirmá que sos mayor de edad.';
        if (!r.privacy)
            e.privacy = 'Aceptá el tratamiento de datos para gestionar el alquiler.';
    }
    if (step >= 1) {
        if (!Array.isArray(r.items) || !r.items.length || r.items.length > 15)
            e.items = 'Agregá entre 1 y 15 trajes.';
        else
            r.items.forEach((i, n) => { if (!i.name?.trim() || !['adulto', 'cabezon'].includes(i.category) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20)
                e['item' + n] = 'Completá personaje, categoría y cantidad.'; });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.pickupDate ?? '') || isNaN(Date.parse(r.pickupDate + 'T12:00:00Z')) || r.pickupDate < now)
            e.pickupDate = 'Elegí una fecha de retiro desde hoy.';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.returnDate ?? '') || isNaN(Date.parse(r.returnDate + 'T12:00:00Z')) || r.returnDate < r.pickupDate)
            e.returnDate = 'La devolución debe ser igual o posterior al retiro.';
        if (!r.pickupWindow)
            e.pickupWindow = 'Elegí el horario de retiro.';
        if (!r.returnWindow)
            e.returnWindow = 'Elegí el horario de devolución.';
        if (r.specialSchedule) {
            if (!r.scheduleAgreement?.trim())
                e.scheduleAgreement = 'Indicá la excepción ya autorizada por Disfraz Cabezón.';
        }
        else {
            if (r.pickupWindow !== windows(r.pickupDate, 'pickup') || !windows(r.pickupDate, 'pickup'))
                e.pickupWindow = 'Para este día hace falta una excepción previamente autorizada.';
            if (r.returnWindow !== windows(r.returnDate, 'return') || !windows(r.returnDate, 'return'))
                e.returnWindow = 'Para este día hace falta una excepción previamente autorizada.';
        }
        if (!Number.isFinite(r.total) || r.total <= 0 || r.total > 100000000)
            e.total = 'Ingresá el total del alquiler acordado por WhatsApp.';
        if (!['half', 'full'].includes(r.payMode))
            e.payMode = 'Elegí la modalidad de pago.';
        if (!['self', 'other'].includes(r.pickupBy))
            e.pickupBy = 'Indicá quién retira.';
        if (r.pickupBy === 'other') {
            req('authorizedName', 'Ingresá nombre completo de quien retira.');
            if (!/^\d{7,8}$/.test(r.authorizedDni ?? ''))
                e.authorizedDni = 'Ingresá el DNI de quien retira.';
        }
        if (!r.priorInfo)
            e.priorInfo = 'Confirmá la información recibida por WhatsApp.';
    }
    if (step >= 2) {
        if (!['servicio', 'sueldo', 'extracto', 'licencia', 'otro'].includes(r.docType))
            e.docType = 'Elegí el comprobante de domicilio.';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(r.docDate ?? ''))
            e.docDate = r.docType === 'licencia' ? 'Indicá el vencimiento de tu licencia.' : 'Indicá la fecha de emisión.';
        else if (r.docType === 'licencia' && r.docDate < now)
            e.docDate = 'La licencia debe estar vigente.';
        else if (r.docType !== 'licencia' && (r.docDate.slice(0, 7) !== now.slice(0, 7) || r.docDate > now))
            e.docDate = 'El documento debe ser del mes en curso y no tener fecha futura.';
        if (!r.namesMatch)
            e.namesMatch = 'Confirmá que el nombre y domicilio coinciden.';
    }
    if (step >= 4) {
        if (!r.terms)
            e.terms = 'Aceptá los términos y condiciones.';
        if (!r.truth)
            e.truth = 'Aceptá la declaración de veracidad.';
        if (norm(r.clarification ?? '') !== norm(r.fullName ?? ''))
            e.clarification = 'La aclaración debe coincidir con el nombre del contratante.';
    }
    return e;
}
const TERMS = [
    {
        "title": "Proveedor y comunicaciones",
        "body": "El servicio es ofrecido bajo la marca Disfraz Cabezón por Lorena Ughetti, CUIT 27-29478271-6, con domicilio comercial en Av. Rivadavia 3314, Ciudad Autónoma de Buenos Aires. Contacto: WhatsApp 11 4989-7969 y disfrazcabezoneventos@gmail.com. Los datos del contratante, los trajes, las fechas, los importes y las autorizaciones particulares registrados en la solicitud integran el acuerdo una vez que el negocio confirma la reserva."
    },
    {
        "title": "Solicitud, revisión y confirmación",
        "body": "Enviar el formulario y adjuntar el pago inicia una solicitud pendiente de revisión; no confirma por sí solo la reserva. Disfraz Cabezón verificará documentación, disponibilidad y acreditación del pago dentro de las 24 horas siguientes al envío y comunicará la confirmación o las observaciones por los canales informados. Si se requiere corregir documentación, el contratante dispone de 12 horas desde el aviso. Si la solicitud se rechaza y no se concreta la contratación, se reintegrará lo abonado dentro de las 24 horas siguientes al rechazo. El comprobante de envío y la confirmación son registros diferentes. Durante la revisión, la solicitud no constituye una aceptación irrevocable del contratante: puede comunicar su desistimiento, sin perjuicio de los derechos legales de revocación y reintegro."
    },
    {
        "title": "Identidad y documentación obligatoria",
        "body": "Debe contratar una persona mayor de 18 años. Son obligatorios: nombre y apellido completos, DNI, domicilio actual, teléfono del contratante, un teléfono alternativo diferente y correo electrónico. Se adjuntan frente y dorso legibles del DNI, tapando el número de trámite, y un documento que permita comprobar el mismo nombre completo y domicilio declarado. Se admite servicio, recibo de sueldo, extracto bancario o documento equivalente emitido en el mes en curso; también licencia de conducir vigente con el domicilio actual, aunque su emisión sea anterior. Un documento sin nombre o sin domicilio no cumple el requisito. Se deben ocultar saldos, consumos y otros datos ajenos a esta verificación. La coincidencia y validez se revisan por el personal."
    },
    {
        "title": "Trajes, precio y seña",
        "body": "Una contratación puede incluir varios trajes de adultos, cabezones o ambas categorías, con las mismas fechas de retiro y devolución. El contratante completa los personajes, cantidades, fechas, franjas horarias y precio total previamente acordados por WhatsApp, incluyendo las promociones aplicables. La seña equivale al 50% del precio total del alquiler: no incluye el depósito de garantía ni se calcula sobre alquiler más garantía. El saldo del alquiler se abona al retirar. Valores informados para esta versión, por traje: adulto, alquiler $60.000 y garantía $60.000; cabezón, alquiler $75.000 y garantía $100.000. El presupuesto particular y cualquier promoción deben quedar registrados para su revisión."
    },
    {
        "title": "Saldo de reservas con pago parcial",
        "body": "El pago del 100% del alquiler congela el precio acordado. Según la política comercial informada, el pago parcial no congela el precio del alquiler: al retirar se descuenta del precio vigente la totalidad del dinero ya abonado. Ejemplo: si el precio inicial era $60.000, se abonaron $30.000 y el precio aplicable pasa a $80.000, el saldo resulta de $50.000, más el depósito de garantía. El importe y toda modificación deben informarse de forma clara y previa, respetando los derechos que correspondan al consumidor. Esta política no autoriza a desconocer una oferta o un precio que legalmente deba respetarse."
    },
    {
        "title": "Datos de cobro y comprobante",
        "body": "Los datos de la cuenta se muestran en el paso de pago una vez completos los datos personales, del alquiler y la documentación exigida. Habilitar ese paso no significa que los documentos hayan sido verificados ni que exista una reserva confirmada. Antes de pagar, el contratante puede consultar estas condiciones. Debe adjuntar el comprobante de la seña o el recibo emitido por el local para un pago en efectivo. La acreditación será verificada por Disfraz Cabezón."
    },
    {
        "title": "Depósito de garantía",
        "body": "El importe denominado habitualmente seguro es un depósito de garantía reembolsable, separado del alquiler. Se entrega al retirar, en efectivo billete, por cada traje incluido. Al devolver, se revisan frente al cliente todas las piezas y su estado. Si todo está completo y en las condiciones correspondientes, el depósito se reintegra en ese mismo momento. Los daños, faltantes, suciedad excesiva o cargos por demora deben documentarse y liquidarse conforme a las condiciones siguientes. El depósito no representa una contratación de seguro con una aseguradora."
    },
    {
        "title": "Fechas, horarios y período incluido",
        "body": "Retiros: lunes a viernes de 16 a 20 h y sábados de 10 a 12 h. Devoluciones: lunes a viernes de 10 a 14 h y sábados de 10 a 12 h. La devolución puede realizarse en cualquier momento dentro de la franja de la fecha acordada. Un alquiler con retiro el viernes de 16 a 20 h y devolución el lunes de 10 a 14 h está incluido en el período base; también puede devolverse el sábado de 10 a 12 h. Las demás fechas y períodos deben coincidir con lo acordado y ser confirmados por el negocio. En feriados se mantienen los horarios habituales, salvo aviso previo del negocio. Todo cambio o excepción requiere autorización expresa previa de Disfraz Cabezón por WhatsApp."
    },
    {
        "title": "Retiro por otra persona",
        "body": "Si el contratante no retira personalmente, debe identificar en el formulario a la persona autorizada con nombre y apellido completos y DNI. La autorización expresa queda comprendida en la firma y aclaración del contratante y debe estar completa antes del retiro. La persona autorizada debe acreditar su identidad al presentarse. Un cambio de persona o el retiro por mensajería requiere comunicación y autorización previa del negocio, con la identificación correspondiente."
    },
    {
        "title": "Entrega, cuidado y limpieza",
        "body": "Al entregar el traje se registra el detalle de piezas y accesorios, su estado y los valores de reposición informados. Deben asentarse los detalles preexistentes para distinguirlos de daños nuevos. El contratante debe utilizar y cuidar las piezas conforme a su finalidad y a las instrucciones recibidas. La limpieza habitual está incluida y no es obligatorio lavar antes de devolver. Si decide lavarlo, debe consultar y respetar las indicaciones específicas del material para evitar daños. No se cobran desgaste normal, defectos preexistentes ni limpieza habitual como si fueran daños. Estas obligaciones no limitan las responsabilidades legales del proveedor."
    },
    {
        "title": "Incidencias y liquidación de la garantía",
        "body": "Si se detectan roturas, manchas excesivas o faltantes, se entrega una constancia con el motivo y se deja registro del estado y de las piezas observadas. Según la política informada, se retiene transitoriamente el total de la garantía de la contratación, incluso cuando esta incluya varios trajes y la observación afecte a uno de ellos. Dentro de las 24 horas desde la devolución, el negocio debe comunicar el detalle del cargo justificado por reparación, limpieza extraordinaria o reposición y reintegrar el remanente que corresponda. La retención no implica la pérdida automática de todo el depósito ni habilita cargos sin fundamento. El contratante puede solicitar el detalle y formular observaciones por WhatsApp."
    },
    {
        "title": "Extensiones y devoluciones fuera de término",
        "body": "Cada día extra tiene un cargo equivalente al 50% del alquiler del traje, por cada traje involucrado. Con los valores informados en esta versión, corresponde $30.000 por adulto y $37.500 por cabezón por día extra. El importe aplicable, incluidas las condiciones de una promoción, debe informarse por WhatsApp y quedar registrado. La misma pauta se aplica a extensiones autorizadas y devoluciones fuera de la fecha o franja acordadas. Avisar una demora no equivale a obtener autorización. El negocio debe confirmar el nuevo plazo y cualquier excepción, incluyendo si corresponde un cargo de $0; el cliente no puede modificarlos unilateralmente. La aplicación de cargos debe respetar los límites legales y no supone la pérdida automática de la garantía."
    },
    {
        "title": "Reprogramaciones",
        "body": "La reprogramación debe solicitarse con al menos siete días de anticipación respecto de la fecha original. Requiere autorización expresa de Disfraz Cabezón y disponibilidad para una nueva fecha dentro de los dos meses contados desde la fecha original. Se toma el precio del alquiler de la nueva fecha y se agrega un 50% de ese nuevo precio; todo lo ya abonado se mantiene a favor del contratante. El saldo se calcula como nuevo precio más el adicional, menos los pagos realizados; la garantía se considera por separado. Ejemplo: nuevo alquiler $80.000, adicional $40.000 y pago previo $30.000: saldo $90.000, más la garantía. Este cargo no se aplica para impedir derechos legales de revocación o frente a un incumplimiento imputable al proveedor."
    },
    {
        "title": "Información previa y cancelaciones",
        "body": "El contratante declara haber recibido antes de comenzar el formulario, por WhatsApp, la información sobre personajes elegidos, precios, promociones y beneficios, fechas y horarios, reserva, seña, cancelaciones, depósito de garantía, devolución, daños y faltantes. Declara que los datos que completa reflejan ese acuerdo. Las condiciones particulares y autorizaciones deben conservarse y estar disponibles junto con la solicitud. Esta declaración no constituye una renuncia a derechos, no valida cláusulas contrarias a normas obligatorias ni convierte la seña en no reintegrable en todos los casos. Las solicitudes de cancelación pueden comunicarse por los mismos canales de contratación, sin perjuicio del derecho de arrepentimiento informado al final."
    },
    {
        "title": "Privacidad y uso de la documentación",
        "body": "Responsable de los datos: Lorena Ughetti, bajo la marca Disfraz Cabezón, CUIT 27-29478271-6, Av. Rivadavia 3314, CABA. Los datos y adjuntos se incorporan al registro de solicitudes para verificar identidad y domicilio, gestionar el alquiler y sus pagos, entregar copias y resolver incidencias. Acceden el personal autorizado y los prestadores técnicos necesarios, con deberes de confidencialidad. Los campos exigidos son necesarios para tramitar esta solicitud; la falta o inexactitud de información impide su validación. Se conservarán mientras sean necesarios para esas finalidades, obligaciones legales y reclamos, y luego corresponderá su supresión. No se autoriza su uso publicitario por aceptar este contrato. Los derechos de acceso, rectificación y supresión pueden solicitarse a disfrazcabezoneventos@gmail.com, acreditando identidad. La AAIP es la autoridad de control de la Ley 25.326."
    },
    {
        "title": "Declaración, firma electrónica y copias",
        "body": "El contratante declara que es mayor de 18 años y que sus datos y documentos son auténticos, actuales y propios. Declara que el nombre del formulario, el DNI, el documento de domicilio y la aclaración de firma corresponden a la misma persona. Al dibujar la firma y escribir su nombre completo presta una firma electrónica asociada a esta solicitud; no se presenta como firma digital certificada. También debe aceptar expresamente estas condiciones y el aviso de privacidad. Si autorizó a otra persona a retirar, su firma comprende esa autorización. Se conservarán la versión de las condiciones aceptadas, la fecha y hora, la declaración y la firma. El cliente puede descargar una copia y solicitar su envío al correo informado o por WhatsApp; el negocio conservará otra copia. El soporte electrónico se elige expresamente, sin perjuicio de solicitar una copia en papel."
    },
    {
        "title": "Derecho de arrepentimiento",
        "body": "En las contrataciones a distancia, el consumidor puede revocar la aceptación dentro de los diez días corridos contados desde la celebración del contrato o la entrega del bien, lo último que ocurra, en los casos y términos legalmente aplicables. Es un derecho irrenunciable y su ejercicio no genera responsabilidad ni gastos para el consumidor. Puede comunicarlo mediante el botón de arrepentimiento del formulario, WhatsApp 11 4989-7969 o disfrazcabezoneventos@gmail.com. Cuando corresponda devolver el bien, debe ponerlo a disposición y los gastos legales de devolución son a cargo del proveedor. Rigen la Ley 24.240 y el Código Civil y Comercial de la Nación."
    }
];
const DEFAULT_RENTAL_PRICES = { adulto: 60000, cabezon: 75000, revision: 'default' };
const LOCAL_TERMS_VERSION = 'DC-LOCAL-2026-10-29.1';
const FORM_STATES = { reserved: 'Reserva', dispatched: 'Despachado', finished: 'Finalizado' };
function localTotal(items, prices) {
    return Math.round(items.reduce((sum, item) => sum + (prices[item.category] || 0) * item.quantity, 0) * 100) / 100;
}
function localSchedule(r, now = todayAR()) {
    return { ...r, pickupWindow: windows(r.pickupDate, 'pickup'), returnWindow: windows(r.returnDate, 'return'), specialSchedule: false, scheduleAgreement: '', payMode: r.pickupDate === now ? 'full' : r.payMode };
}
/** The online validator and its document/payment requirements remain unchanged. */
function validateLocal(r, step, now = todayAR()) {
    const errors = validate(r, Math.min(step, 1), now);
    if (errors.priorInfo)
        errors.priorInfo = 'Confirmá la información recibida en el local.';
    if (step >= 1 && r.pickupDate === now && r.payMode !== 'full')
        errors.payMode = 'El retiro de hoy requiere alquiler completo.';
    if (step >= 1 && (r.specialSchedule || r.pickupWindow !== windows(r.pickupDate, 'pickup') || r.returnWindow !== windows(r.returnDate, 'return')))
        errors.pickupWindow = 'Los horarios son fijos según la fecha elegida.';
    if (step >= 2 && !r.namesMatch)
        errors.namesMatch = 'Confirmá que el DNI corresponde al contratante.';
    if (step >= 3) {
        if (!r.terms)
            errors.terms = 'Aceptá los términos y condiciones.';
        if (!r.truth)
            errors.truth = 'Aceptá la declaración de veracidad.';
        if (norm(r.clarification) !== norm(r.fullName))
            errors.clarification = 'La aclaración debe coincidir con el nombre del contratante.';
    }
    return errors;
}
// A separate contract for the in-store flow; the online contract is untouched.
const replacements = {
    'Solicitud, revisión y confirmación': 'Este formulario se completa presencialmente en el local y registra una solicitud de alquiler. No acredita pagos ni confirma por sí solo la entrega. El equipo verifica identidad, disponibilidad y las condiciones particulares antes de confirmar o despachar el alquiler.',
    'Identidad y documentación obligatoria': 'Debe contratar una persona mayor de 18 años. Se solicitan datos del contratante, domicilio declarado, teléfonos, correo y fotos del frente y dorso del DNI, tapando el número de trámite. En esta modalidad presencial no se solicita comprobante de domicilio. El personal revisa la identidad y los documentos.',
    'Trajes, precio y seña': 'El precio por traje se obtiene de la tarifa vigente del local para Disfraz adulto o Disfraz cabezón, multiplicada por la cantidad. El resumen conserva la tarifa aceptada al enviar. Para retiros en el mismo día corresponde alquiler completo; para fechas futuras puede elegirse 50% o alquiler completo. Esta elección indica la modalidad acordada y no declara que el pago haya sido realizado. La garantía se informa por separado.',
    'Datos de cobro y comprobante': 'El pago se gestiona presencialmente con el equipo. Este formulario no solicita ni admite comprobantes de pago, no muestra una cuenta bancaria y no registra cobros. La modalidad elegida no acredita un pago. Cualquier cobro debe verificarse y registrarse por separado en el local.',
    'Información previa y cancelaciones': 'El contratante declara haber recibido en el local información sobre los trajes, precios, fechas, horarios, reserva, modalidad de pago, garantía, devolución, daños y faltantes. Las condiciones particulares quedan registradas para su revisión. Esta declaración no implica renuncia a derechos legales. Las cancelaciones se comunican al negocio por sus canales habituales.',
    'Declaración, firma electrónica y copias': 'El contratante declara que es mayor de 18 años y que los datos declarados y las fotos del DNI son auténticos, actuales y propios. El nombre del formulario, el DNI y la aclaración corresponden a la misma persona. La firma electrónica comprende la solicitud y, si corresponde, la autorización de retiro por otra persona. Se conserva la versión de estas condiciones, fecha, datos y firma originales. El cliente puede descargar su copia electrónica; las modificaciones de gestión posteriores no sustituyen la aceptación original.',
};
const localTerms = TERMS.map(term => ({ ...term, body: replacements[term.title] || term.body }));
