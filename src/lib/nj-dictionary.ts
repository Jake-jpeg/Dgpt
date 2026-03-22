import { Locale } from './ny-dictionary';

export const njDictionary: Record<Locale, any> = {
  en: {
    hero: {
      title: "New Jersey Uncontested Divorce",
      subtitle: "Made Simple",
      description: "Get your divorce forms prepared and explained in plain language. No lawyers needed for simple, uncontested cases.",
      cta: "Check If You Qualify",
      fee: "$29 one-time fee • No hidden costs"
    },
    howToUse: {
      title: "How to Use",
      subtitle: "Quick tips to get the most out of DivorceGPT",
      cards: [
        { title: "Create Your Forms", desc: "Answer the questions. DivorceGPT prepares your documents step by step." },
        { title: "Reference Your Forms", desc: "Tell DivorceGPT which form you're asking about — Complaint, Certifications, Final Judgment, etc." },
        { title: "Ask in Your Language", desc: "Just ask in whatever language you're comfortable with. We support Spanish, Chinese, Korean, Russian, and Haitian Creole." },
        { title: "Ask About Filing", desc: "Not sure what to do with your forms? Ask about the filing process, court locations, fees, or what happens next." }
      ]
    },
    howItWorks: {
      title: "How It Works",
      subtitle: "Two phases. Answer questions, file your documents, done.",
      steps: [
        { title: "Check Eligibility", desc: "Answer a few questions to confirm this service is right for you." },
        { title: "Pay $29", desc: "One-time payment. No hidden fees. No subscriptions." },
        { title: "Get Your Forms", desc: "Receive your prepared divorce forms ready for filing." },
        { title: "Ask Questions", desc: "Use DivorceGPT to understand any part of the process." }
      ]
    },
    eligibilitySection: {
      title: "Is This Right For You?",
      subtitle: "This service is for New Jersey uncontested divorces with:",
      items: [
        "No children under 18 and neither party is pregnant",
        "No property or debts to divide",
        "No alimony / spousal support",
        "Both spouses agree to divorce",
        "Spouse will sign documents",
        "12+ months NJ residency"
      ],
      cta: "Check Your Eligibility"
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "Is this legal advice?", a: "No. DivorceGPT explains what divorce forms ask for and how to file them. It does not provide legal advice. For legal advice, consult an attorney." },
        { q: "What technology powers DivorceGPT?", a: "DivorceGPT uses advanced AI technology via a secure commercial API. Under our API provider's terms, your inputs are not used for AI model training and are automatically deleted within days. June Guided Solutions, LLC (the company behind DivorceGPT) does not retain any chat history or conversation data. If you need support, you must provide your own screenshot of the conversation — we have no way to retrieve it." },
        { q: "How long does the process take?", a: "You can complete your forms in minutes, but the overall divorce process takes time — the court needs to process filings between each phase. Timeline varies by county. Your session remains valid for 12 months to cover even the slowest courts." },
        { q: "How do I access my session?", a: "After payment, you'll be redirected to your session page. Bookmark this page — the URL is your access link. There are no accounts or passwords." },
        { q: "What if my spouse won't cooperate?", a: "This service is for uncontested divorces where both spouses agree. If your spouse won't cooperate, you may need a contested divorce attorney." },
        { q: "Can I get a refund?", a: "If you don't qualify after the eligibility check, you won't be charged. Once forms are generated, refunds are not available." }
      ]
    },
    qualify: {
      title: "Check Your Eligibility",
      subtitle: "Answer these questions to confirm this service is right for your situation.",
      successTitle: "You Qualify!",
      successMsg: "Based on your answers, you're eligible for our New Jersey uncontested divorce service.",
      failTitle: "Not Eligible",
      failMsg: "Based on your answers, this service may not be right for your situation.",
      reasons: "Reasons:",
      consult: "You may need to consult with a family law attorney for your specific situation.",
      yes: "Yes",
      no: "No",
      submit: "Check Eligibility",
      continue: "Continue to Payment",
      back: "Back to Home",
      questions: {
        residency: { q: "Has at least one spouse lived in New Jersey continuously for at least 12 months?", d: "NJ requires 12 consecutive months of residency by at least one party before filing." },
        children: { q: "Are there any unemancipated children of the marriage, or is either party currently pregnant?", d: "Includes children under 18 who are not self-supporting. If either spouse is currently pregnant, this must be answered Yes." },
        property: { q: "Is there any property, debts, pensions, or retirement accounts to divide?", d: "Real estate, 401(k), large debts, etc." },
        support: { q: "Is either spouse asking for spousal support (alimony)?", d: "Either now or in the future." },
        uncontested: { q: "Do both spouses agree to the divorce and will both cooperate with signing the required documents?", d: "Both parties want the divorce and the other spouse will sign Acknowledgment of Service before a notary." },
        military: { q: "Is your spouse currently serving in the U.S. military?", d: "Active duty, reserves on active orders, or National Guard on federal activation." },
        domesticViolence: { q: "Has there been any domestic violence case, restraining order, or order of protection between you and your spouse?", d: "This includes any current or past TRO, final restraining order, order of protection, or DV complaint — even if it was dismissed or withdrawn." }
      },
      militaryDisqualification: "DivorceGPT cannot prepare documents for cases where a spouse is currently serving in the U.S. military.\n\nActive duty service members have special legal protections under the Servicemembers Civil Relief Act (SCRA), including protections against default judgments. These cases require additional procedural steps and court oversight that fall outside the scope of this document preparation service.\n\nWe recommend consulting with a family law attorney who handles military divorce cases.",
      dvDisqualification: "DivorceGPT cannot prepare documents for cases involving domestic violence history between the parties.\n\nDomestic violence cases — including active or past restraining orders, orders of protection, or DV complaints — create legal complexities that fall outside the scope of this document preparation service. These may include address confidentiality requirements, modified service procedures, custody presumptions, and mandatory court disclosures.\n\nEven if the order was dismissed or has expired, the history must be disclosed on court forms and may affect how the court processes your case.\n\nWe recommend consulting with a family law attorney experienced in domestic violence matters. If you are in danger, contact the National Domestic Violence Hotline at 1-800-799-7233.",
      disclosure: {
        title: "What DivorceGPT Does",
        description: "DivorceGPT is a document preparation service. It uses the official forms required by the New Jersey Superior Court, Chancery Division — Family Part.",
        serviceTitle: "The service:",
        services: [
          "Transfers your answers onto the required forms",
          "Displays plain-language labels identifying what information each form field requests",
          "Generates a PDF packet for your review before filing"
        ],
        disclaimer: "DivorceGPT does not review your answers for legal sufficiency, provide legal advice, or represent you in court.",
        freeFormsTitle: "Free Forms Available",
        freeFormsDesc: "Official divorce forms are available from the New Jersey Courts website (njcourts.gov). DivorceGPT automates filling them in — you can always file them yourself for free.",
        continueButton: "Continue with DivorceGPT ($29)"
      },
      fields: {
        plaintiffName: { label: "Plaintiff Name", desc: "Person filing" },
        defendantName: { label: "Defendant Name", desc: "Other spouse" },
        filingCounty: { label: "Filing County", desc: "Where to file" },
        residencyBasis: { label: "Residency Basis", desc: "Who qualifies" },
        qualifyingAddress: { label: "Qualifying Address", desc: "Residency address" },
        phone: { label: "Phone", desc: "Court contact" },
        plaintiffAddress: { label: "Plaintiff Address", desc: "Mailing address" },
        defendantAddress: { label: "Defendant Address", desc: "Service address" },
        ceremonyType: { label: "Ceremony Type", desc: "Civil or Religious" },
        indexNumber: { label: "Docket Number", desc: "From clerk" },
        summonsDate: { label: "Filing Date", desc: "Date Complaint was filed with clerk" },
        marriageDate: { label: "Marriage Date", desc: "When married" },
        marriageCity: { label: "Marriage City", desc: "Where married" },
        marriageCounty: { label: "Marriage County", desc: "County where married" },
        marriageState: { label: "Marriage State", desc: "State/Country" },
        breakdownDate: { label: "Separation Date", desc: "Irreconcilable differences" },
        entryDate: { label: "Judgment Entry Date", desc: "Date clerk entered Final Judgment" },
        currentAddress: { label: "Current Address", desc: "For mailing" },
        summonsWithNotice: "Complaint for Divorce"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Form Assistant",
      welcome: "Welcome to DivorceGPT",
      intro: "I can help explain your New Jersey divorce forms, what they ask for, and how to file them.",
      placeholder: "Ask about your divorce forms...",
      disclaimer: "DivorceGPT explains forms and procedures and may contain errors. This is not legal advice.",
      suggestions: [
        "What is the Complaint for Divorce?",
        "How do I file in Bergen County?",
        "What are filing fees?",
        "What are irreconcilable differences?"
      ]
    },
    forms: {
      hidePanel: "Hide Panel",
      showPanel: "Show Panel",
      sessionActive: "Session active",
      complete: "Complete",
      phase: "Phase",
      commence: "Commence",
      submit: "Submit",
      finalize: "Finalize",
      forms: "FORMS",
      divorceWorkflow: "DIVORCE WORKFLOW",
      needHelp: "Need help?",
      askInChat: "Just ask in the chat!",
      allDone: "All done!",
      askQuestions: "Ask questions about filing, procedures, or forms.",
      downloadUD1: "Download Complaint",
      downloadPackage: "Download Package",
      downloadFinalForms: "Download Final Forms",
      generating: "Generating...",
      haveIndexNumber: "I have my Docket Number → Phase 2",
      judgmentEntered: "Judgment Entered → Phase 3",
      startOver: "Start over",
      goBackPhase1: "← Go back to Phase 1",
      goBackPhase2: "← Go back to Phase 2",
      hidePanelContinue: "Hide Panel & Continue Chatting",
      typeAnswer: "Type your answer...",
      askAnything: "Ask me anything about your forms..."
    },
    legal: {
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms of Service",
      lastUpdated: "Last updated: January 25, 2026",
      backHome: "Back to Home",
      officialNotice: "OFFICIAL NOTICE: The legally binding terms below are presented in English to ensure accuracy with New Jersey State law.",
      sections: {
        agreement: "Agreement to Terms",
        advice: "Important: Not Legal Advice",
        service: "Service Description",
        eligibility: "Eligibility",
        ai: "AI-Generated Content",
        payment: "Payment and Refunds",
        liability: "Limitation of Liability",
        contact: "Contact Us"
      }
    }
  },
  es: {
    hero: {
      title: "Divorcio No Contestado en Nueva Jersey",
      subtitle: "Hecho Simple",
      description: "Obtenga sus formularios de divorcio preparados y explicados en lenguaje sencillo. No necesita abogado para casos simples y no contestados.",
      cta: "Verifique Si Califica",
      fee: "$29 pago único • Sin costos ocultos"
    },
    howToUse: {
      title: "Cómo Usar",
      subtitle: "Consejos rápidos para aprovechar DivorceGPT al máximo",
      cards: [
        { title: "Cree Sus Formularios", desc: "Responda las preguntas. DivorceGPT prepara sus documentos paso a paso." },
        { title: "Consulte Sus Formularios", desc: "Dígale a DivorceGPT sobre qué formulario pregunta — Demanda, Certificaciones, Sentencia Final, etc." },
        { title: "Pregunte en Su Idioma", desc: "Simplemente pregunte en el idioma que le sea más cómodo. Apoyamos español, chino, coreano, ruso y criollo haitiano." },
        { title: "Pregunte Sobre la Presentación", desc: "¿No sabe qué hacer con sus formularios? Pregunte sobre el proceso de presentación, ubicaciones de tribunales, tarifas, o qué sigue." }
      ]
    },
    howItWorks: {
      title: "Cómo Funciona",
      subtitle: "Dos fases. Responda preguntas, presente sus documentos, listo.",
      steps: [
        { title: "Verificar Elegibilidad", desc: "Responda algunas preguntas para confirmar que este servicio es adecuado para usted." },
        { title: "Pague $29", desc: "Pago único. Sin tarifas ocultas. Sin suscripciones." },
        { title: "Obtenga Sus Formularios", desc: "Reciba sus formularios de divorcio preparados listos para presentar." },
        { title: "Haga Preguntas", desc: "Use DivorceGPT para entender cualquier parte del proceso." }
      ]
    },
    eligibilitySection: {
      title: "¿Es Esto Adecuado Para Usted?",
      subtitle: "Este servicio es para divorcios no contestados en Nueva Jersey con:",
      items: [
        "Sin hijos menores de 18 años",
        "Sin propiedades o deudas para dividir",
        "Sin solicitudes de pensión alimenticia",
        "Ambos cónyuges están de acuerdo con el divorcio",
        "El cónyuge firmará los documentos",
        "12+ meses de residencia en NJ"
      ],
      cta: "Verifique Su Elegibilidad"
    },
    faq: {
      title: "Preguntas Frecuentes",
      items: [
        { q: "¿Es esto asesoría legal?", a: "No. DivorceGPT explica lo que piden los formularios de divorcio y cómo presentarlos. No proporciona asesoría legal. Para asesoría legal, consulte a un abogado." },
        { q: "¿Qué tecnología usa DivorceGPT?", a: "DivorceGPT usa tecnología avanzada de IA a través de una API comercial segura. Según los términos de nuestro proveedor de API, sus datos no se usan para entrenar modelos de IA y se eliminan automáticamente en días. June Guided Solutions, LLC (la empresa detrás de DivorceGPT) no retiene ningún historial de chat ni datos de conversación. Si necesita soporte, debe proporcionar su propia captura de pantalla de la conversación — no tenemos forma de recuperarla." },
        { q: "¿Cuánto tiempo toma el proceso?", a: "Puede completar sus formularios en minutos, pero el proceso general de divorcio toma tiempo — el tribunal necesita procesar las presentaciones entre cada fase. El tiempo varía por condado. Su sesión permanece válida por 12 meses." },
        { q: "¿Cómo accedo a mi sesión?", a: "Después del pago, será redirigido a su página de sesión. Marque esta página como favorita — la URL es su enlace de acceso. No hay cuentas ni contraseñas." },
        { q: "¿Qué pasa si mi cónyuge no coopera?", a: "Este servicio es para divorcios no contestados donde ambos cónyuges están de acuerdo. Si su cónyuge no coopera, puede necesitar un abogado de divorcio contencioso." },
        { q: "¿Puedo obtener un reembolso?", a: "Si no califica después de la verificación de elegibilidad, no se le cobrará. Una vez que se generan los formularios, no hay reembolsos disponibles." }
      ]
    },
    qualify: {
      title: "Verifique Su Elegibilidad",
      subtitle: "Responda estas preguntas para confirmar que este servicio es adecuado para su situación.",
      successTitle: "¡Usted Califica!",
      successMsg: "Según sus respuestas, es elegible para nuestro servicio de divorcio no contestado en Nueva Jersey.",
      failTitle: "No Elegible",
      failMsg: "Según sus respuestas, este servicio puede no ser adecuado para su situación.",
      reasons: "Razones:",
      consult: "Es posible que necesite consultar con un abogado de derecho familiar para su situación específica.",
      yes: "Sí",
      no: "No",
      submit: "Verificar Elegibilidad",
      continue: "Continuar al Pago",
      back: "Volver al Inicio",
      questions: {
        residency: { q: "¿Ha vivido al menos uno de los cónyuges en Nueva Jersey continuamente durante al menos 12 meses?", d: "NJ requiere 12 meses consecutivos de residencia por al menos una de las partes antes de la presentación." },
        children: { q: "¿Hay hijos menores de edad del matrimonio, o alguna de las partes está embarazada?", d: "Incluye hijos menores de 18 años que no se mantienen por sí mismos. Si alguno de los cónyuges está embarazada, debe responder Sí." },
        property: { q: "¿Hay propiedades, deudas, pensiones o cuentas de jubilación para dividir?", d: "Bienes raíces, 401(k), deudas grandes, etc." },
        support: { q: "¿Alguno de los cónyuges solicita manutención conyugal (pensión alimenticia)?", d: "Ya sea ahora o en el futuro." },
        uncontested: { q: "¿Ambos cónyuges están de acuerdo con el divorcio y cooperarán con la firma de los documentos requeridos?", d: "Ambas partes quieren el divorcio y el otro cónyuge firmará el Reconocimiento de Servicio ante un notario." },
        military: { q: "¿Su cónyuge está actualmente sirviendo en las fuerzas armadas de los EE.UU.?", d: "Servicio activo, reservas en órdenes activas, o Guardia Nacional en activación federal." },
        domesticViolence: { q: "¿Ha habido algún caso de violencia doméstica, orden de restricción u orden de protección entre usted y su cónyuge?", d: "Esto incluye cualquier TRO actual o pasada, orden de restricción final, orden de protección, o queja de VD — incluso si fue desestimada o retirada." }
      },
      militaryDisqualification: "DivorceGPT no puede preparar documentos para casos donde un cónyuge está sirviendo actualmente en las fuerzas armadas de los EE.UU.\n\nLos miembros del servicio activo tienen protecciones legales especiales bajo la Ley de Alivio Civil para Miembros del Servicio (SCRA), incluyendo protecciones contra sentencias por defecto. Estos casos requieren pasos procesales adicionales y supervisión del tribunal.\n\nRecomendamos consultar con un abogado de derecho familiar que maneje casos de divorcio militar.",
      dvDisqualification: "DivorceGPT no puede preparar documentos para casos que involucren historial de violencia doméstica entre las partes.\n\nLos casos de violencia doméstica — incluyendo órdenes de restricción activas o pasadas, órdenes de protección, o quejas de VD — crean complejidades legales fuera del alcance de este servicio de preparación de documentos.\n\nIncluso si la orden fue desestimada o ha expirado, el historial debe ser revelado en los formularios del tribunal.\n\nRecomendamos consultar con un abogado de derecho familiar con experiencia en asuntos de violencia doméstica. Si está en peligro, contacte la Línea Nacional de Violencia Doméstica al 1-800-799-7233.",
      disclosure: {
        title: "Qué Hace DivorceGPT",
        description: "DivorceGPT es un servicio de preparación de documentos. Utiliza los formularios oficiales requeridos por el Tribunal Superior de Nueva Jersey, División de Cancillería — Parte de Familia.",
        serviceTitle: "El servicio:",
        services: [
          "Transfiere sus respuestas a los formularios requeridos",
          "Muestra etiquetas en lenguaje sencillo que identifican qué información solicita cada campo",
          "Genera un paquete PDF para su revisión antes de la presentación"
        ],
        disclaimer: "DivorceGPT no revisa sus respuestas por suficiencia legal, no proporciona asesoría legal, ni lo representa en el tribunal.",
        freeFormsTitle: "Formularios Gratuitos Disponibles",
        freeFormsDesc: "Los formularios oficiales de divorcio están disponibles en el sitio web de los Tribunales de Nueva Jersey (njcourts.gov). DivorceGPT automatiza el llenado — siempre puede presentarlos usted mismo de forma gratuita.",
        continueButton: "Continuar con DivorceGPT ($29)"
      },
      fields: {
        plaintiffName: { label: "Nombre del Demandante", desc: "Persona que presenta" },
        defendantName: { label: "Nombre del Demandado", desc: "Otro cónyuge" },
        filingCounty: { label: "Condado de Presentación", desc: "Dónde presentar" },
        residencyBasis: { label: "Base de Residencia", desc: "Quién califica" },
        qualifyingAddress: { label: "Dirección Calificante", desc: "Dirección de residencia" },
        phone: { label: "Teléfono", desc: "Contacto del tribunal" },
        plaintiffAddress: { label: "Dirección del Demandante", desc: "Dirección postal" },
        defendantAddress: { label: "Dirección del Demandado", desc: "Dirección de servicio" },
        ceremonyType: { label: "Tipo de Ceremonia", desc: "Civil o Religiosa" },
        indexNumber: { label: "Número de Expediente", desc: "Del secretario" },
        summonsDate: { label: "Fecha de Presentación", desc: "Fecha en que se presentó la Demanda" },
        marriageDate: { label: "Fecha de Matrimonio", desc: "Cuándo se casó" },
        marriageCity: { label: "Ciudad del Matrimonio", desc: "Dónde se casó" },
        marriageCounty: { label: "Condado del Matrimonio", desc: "Condado donde se casó" },
        marriageState: { label: "Estado del Matrimonio", desc: "Estado/País" },
        breakdownDate: { label: "Fecha de Separación", desc: "Diferencias irreconciliables" },
        entryDate: { label: "Fecha de Entrada de Sentencia", desc: "Fecha de entrada de la Sentencia Final" },
        currentAddress: { label: "Dirección Actual", desc: "Para correo" },
        summonsWithNotice: "Demanda de Divorcio"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Asistente de Formularios",
      welcome: "Bienvenido a DivorceGPT",
      intro: "Puedo ayudar a explicar sus formularios de divorcio de Nueva Jersey, lo que piden y cómo presentarlos.",
      placeholder: "Pregunte sobre sus formularios de divorcio...",
      disclaimer: "DivorceGPT explica formularios y procedimientos y puede contener errores. Esto no es asesoría legal.",
      suggestions: [
        "¿Qué es la Demanda de Divorcio?",
        "¿Cómo presento en el Condado de Bergen?",
        "¿Cuáles son las tarifas de presentación?",
        "¿Qué son las diferencias irreconciliables?"
      ]
    },
    forms: {
      hidePanel: "Ocultar Panel",
      showPanel: "Mostrar Panel",
      sessionActive: "Sesión activa",
      complete: "Completo",
      phase: "Fase",
      commence: "Comenzar",
      submit: "Enviar",
      finalize: "Finalizar",
      forms: "FORMULARIOS",
      divorceWorkflow: "PROCESO DE DIVORCIO",
      needHelp: "¿Necesita ayuda?",
      askInChat: "¡Pregunte en el chat!",
      allDone: "¡Todo listo!",
      askQuestions: "Haga preguntas sobre la presentación, procedimientos o formularios.",
      downloadUD1: "Descargar Demanda",
      downloadPackage: "Descargar Paquete",
      downloadFinalForms: "Descargar Formularios Finales",
      generating: "Generando...",
      haveIndexNumber: "Tengo mi Número de Expediente → Fase 2",
      judgmentEntered: "Sentencia Ingresada → Fase 3",
      startOver: "Empezar de nuevo",
      goBackPhase1: "← Volver a la Fase 1",
      goBackPhase2: "← Volver a la Fase 2",
      hidePanelContinue: "Ocultar Panel y Continuar Chateando",
      typeAnswer: "Escriba su respuesta...",
      askAnything: "Pregunte lo que sea sobre sus formularios..."
    },
    legal: {
      privacyTitle: "Política de Privacidad",
      termsTitle: "Términos de Servicio",
      lastUpdated: "Última actualización: 25 de enero de 2026",
      backHome: "Volver al Inicio",
      officialNotice: "AVISO OFICIAL: Los términos legalmente vinculantes a continuación se presentan en inglés para garantizar la precisión con la ley del Estado de Nueva Jersey.",
      sections: {
        agreement: "Acuerdo de Términos",
        advice: "Importante: No es Asesoría Legal",
        service: "Descripción del Servicio",
        eligibility: "Elegibilidad",
        ai: "Contenido Generado por IA",
        payment: "Pago y Reembolsos",
        liability: "Limitación de Responsabilidad",
        contact: "Contáctenos"
      }
    }
  },
  zh: {
    hero: {
      title: "新泽西州无争议离婚",
      subtitle: "简单办理",
      description: "以通俗语言为您准备和解释离婚表格。简单的无争议案件不需要律师。",
      cta: "检查您是否符合条件",
      fee: "$29 一次性费用 • 无隐藏费用"
    },
    howToUse: {
      title: "如何使用",
      subtitle: "充分利用DivorceGPT的快速提示",
      cards: [
        { title: "创建您的表格", desc: "回答问题。DivorceGPT逐步为您准备文件。" },
        { title: "参考您的表格", desc: "告诉DivorceGPT您在询问哪个表格——诉状、认证、最终判决等。" },
        { title: "用您的语言提问", desc: "用您最舒适的语言提问。我们支持西班牙语、中文、韩语、俄语和海地克里奥尔语。" },
        { title: "询问申请事宜", desc: "不确定如何处理您的表格？询问申请流程、法院地点、费用或后续步骤。" }
      ]
    },
    howItWorks: {
      title: "工作原理",
      subtitle: "两个阶段。回答问题，提交文件，完成。",
      steps: [
        { title: "检查资格", desc: "回答几个问题以确认此服务适合您。" },
        { title: "支付$29", desc: "一次性付款。无隐藏费用。无订阅。" },
        { title: "获取您的表格", desc: "收到准备好的离婚表格，可以立即提交。" },
        { title: "提出问题", desc: "使用DivorceGPT了解流程的任何部分。" }
      ]
    },
    eligibilitySection: {
      title: "这适合您吗？",
      subtitle: "此服务适用于新泽西州无争议离婚，包括：",
      items: [
        "没有18岁以下的子女",
        "没有需要分割的财产或债务",
        "没有配偶赡养费请求",
        "双方同意离婚",
        "配偶将签署文件",
        "在新泽西居住12个月以上"
      ],
      cta: "检查您的资格"
    },
    faq: {
      title: "常见问题",
      items: [
        { q: "这是法律建议吗？", a: "不是。DivorceGPT解释离婚表格的要求和如何提交。它不提供法律建议。如需法律建议，请咨询律师。" },
        { q: "DivorceGPT使用什么技术？", a: "DivorceGPT 通过安全商业 API 使用先进的 AI 技术。根据我们 API 提供商的条款，您的输入不会用于 AI 模型训练，并会在数天内自动删除。June Guided Solutions, LLC（DivorceGPT 的运营公司）不会保留任何聊天记录或对话数据。如需支持，您必须提供自己的对话截图——我们无法检索对话内容。" },
        { q: "流程需要多长时间？", a: "您可以在几分钟内完成表格，但整个离婚过程需要时间——法院需要在每个阶段之间处理申请。时间因县而异。您的会话在12个月内保持有效。" },
        { q: "如何访问我的会话？", a: "付款后，您将被重定向到您的会话页面。收藏此页面——URL就是您的访问链接。没有账户或密码。" },
        { q: "如果配偶不合作怎么办？", a: "此服务适用于双方同意的无争议离婚。如果您的配偶不合作，您可能需要一位争议离婚律师。" },
        { q: "我可以退款吗？", a: "如果您在资格检查后不符合条件，将不会向您收费。一旦生成表格，将不提供退款。" }
      ]
    },
    qualify: {
      title: "检查您的资格",
      subtitle: "回答这些问题以确认此服务适合您的情况。",
      successTitle: "您符合条件！",
      successMsg: "根据您的回答，您有资格使用我们的新泽西州无争议离婚服务。",
      failTitle: "不符合条件",
      failMsg: "根据您的回答，此服务可能不适合您的情况。",
      reasons: "原因：",
      consult: "您可能需要咨询家庭法律师了解您的具体情况。",
      yes: "是",
      no: "否",
      submit: "检查资格",
      continue: "继续付款",
      back: "返回首页",
      questions: {
        residency: { q: "至少有一位配偶在新泽西州连续居住至少12个月吗？", d: "新泽西州要求至少一方在申请前连续居住12个月。" },
        children: { q: "婚姻中有未成年子女吗？或者任何一方目前怀孕了吗？", d: "包括18岁以下不能自立的子女。如果任何一方目前怀孕，必须回答是。" },
        property: { q: "有需要分割的财产、债务、养老金或退休账户吗？", d: "房地产、401(k)、大额债务等。" },
        support: { q: "任何一方是否要求配偶赡养费？", d: "现在或将来。" },
        uncontested: { q: "双方是否都同意离婚，并且都愿意配合签署所需文件？", d: "双方都想离婚，另一方配偶将在公证人面前签署送达确认书。" },
        military: { q: "您的配偶目前是否在美国军队服役？", d: "现役、预备役现役命令或联邦激活的国民警卫队。" },
        domesticViolence: { q: "您和配偶之间是否有任何家庭暴力案件、限制令或保护令？", d: "这包括任何现有或过去的临时限制令、最终限制令、保护令或家暴投诉——即使已被撤销或撤回。" }
      },
      militaryDisqualification: "DivorceGPT无法为配偶目前在美国军队服役的案件准备文件。\n\n现役军人在《军人民事救济法》(SCRA)下享有特殊法律保护，包括防止缺席判决的保护。这些案件需要额外的程序步骤和法院监督。\n\n我们建议咨询处理军事离婚案件的家庭法律师。",
      dvDisqualification: "DivorceGPT无法为涉及双方家庭暴力历史的案件准备文件。\n\n家庭暴力案件——包括现有或过去的限制令、保护令或家暴投诉——产生的法律复杂性超出了本文件准备服务的范围。\n\n即使该命令已被撤销或已过期，该历史必须在法院表格上披露。\n\n我们建议咨询在家庭暴力事务方面有经验的家庭法律师。如果您处于危险中，请拨打全国家庭暴力热线1-800-799-7233。",
      disclosure: {
        title: "DivorceGPT的功能",
        description: "DivorceGPT是一项文件准备服务。它使用新泽西州高等法院衡平法庭——家庭部所要求的官方表格。",
        serviceTitle: "服务内容：",
        services: [
          "将您的答案转移到所需的表格上",
          "显示通俗语言标签，标识每个表格字段请求的信息",
          "生成PDF包供您在提交前审阅"
        ],
        disclaimer: "DivorceGPT不审查您答案的法律充分性，不提供法律建议，也不在法庭上代表您。",
        freeFormsTitle: "免费表格可用",
        freeFormsDesc: "官方离婚表格可在新泽西州法院网站(njcourts.gov)获取。DivorceGPT自动填写——您始终可以自己免费提交。",
        continueButton: "继续使用DivorceGPT（$29）"
      },
      fields: {
        plaintiffName: { label: "原告姓名", desc: "申请人" },
        defendantName: { label: "被告姓名", desc: "另一方配偶" },
        filingCounty: { label: "申请县", desc: "在哪里申请" },
        residencyBasis: { label: "居住依据", desc: "谁符合条件" },
        qualifyingAddress: { label: "符合条件的地址", desc: "居住地址" },
        phone: { label: "电话", desc: "法院联系方式" },
        plaintiffAddress: { label: "原告地址", desc: "邮寄地址" },
        defendantAddress: { label: "被告地址", desc: "送达地址" },
        ceremonyType: { label: "仪式类型", desc: "民事或宗教" },
        indexNumber: { label: "案卷编号", desc: "来自书记员" },
        summonsDate: { label: "提交日期", desc: "诉状提交日期" },
        marriageDate: { label: "结婚日期", desc: "何时结婚" },
        marriageCity: { label: "结婚城市", desc: "在哪里结婚" },
        marriageCounty: { label: "结婚县", desc: "结婚所在县" },
        marriageState: { label: "结婚州", desc: "州/国家" },
        breakdownDate: { label: "分居日期", desc: "不可调和的分歧" },
        entryDate: { label: "判决登记日期", desc: "最终判决登记日期" },
        currentAddress: { label: "当前地址", desc: "用于邮寄" },
        summonsWithNotice: "离婚诉状"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "表格助手",
      welcome: "欢迎使用DivorceGPT",
      intro: "我可以帮助解释您的新泽西州离婚表格、它们的要求以及如何提交。",
      placeholder: "询问您的离婚表格...",
      disclaimer: "DivorceGPT解释表格和程序，可能包含错误。这不是法律建议。",
      suggestions: [
        "什么是离婚诉状？",
        "如何在Bergen县提交？",
        "申请费用是多少？",
        "什么是不可调和的分歧？"
      ]
    },
    forms: {
      hidePanel: "隐藏面板",
      showPanel: "显示面板",
      sessionActive: "会话活跃",
      complete: "完成",
      phase: "阶段",
      commence: "开始",
      submit: "提交",
      finalize: "完成",
      forms: "表格",
      divorceWorkflow: "离婚流程",
      needHelp: "需要帮助？",
      askInChat: "在聊天中提问！",
      allDone: "全部完成！",
      askQuestions: "询问有关提交、程序或表格的问题。",
      downloadUD1: "下载诉状",
      downloadPackage: "下载文件包",
      downloadFinalForms: "下载最终表格",
      generating: "生成中...",
      haveIndexNumber: "我有案卷编号 → 阶段2",
      judgmentEntered: "判决已登记 → 阶段3",
      startOver: "重新开始",
      goBackPhase1: "← 返回阶段1",
      goBackPhase2: "← 返回阶段2",
      hidePanelContinue: "隐藏面板并继续聊天",
      typeAnswer: "输入您的答案...",
      askAnything: "询问有关您表格的任何问题..."
    },
    legal: {
      privacyTitle: "隐私政策",
      termsTitle: "服务条款",
      lastUpdated: "最后更新：2026年1月25日",
      backHome: "返回首页",
      officialNotice: "正式通知：以下具有法律约束力的条款以英文呈现，以确保与新泽西州法律的准确性。",
      sections: {
        agreement: "条款协议",
        advice: "重要：非法律建议",
        service: "服务描述",
        eligibility: "资格",
        ai: "AI生成内容",
        payment: "付款和退款",
        liability: "责任限制",
        contact: "联系我们"
      }
    }
  },
  ko: {
    hero: {
      title: "뉴저지 무분쟁 이혼",
      subtitle: "간편하게",
      description: "이혼 양식을 쉬운 언어로 준비하고 설명해 드립니다. 간단한 무분쟁 사건에는 변호사가 필요하지 않습니다.",
      cta: "자격 확인하기",
      fee: "$29 일회성 비용 • 숨겨진 비용 없음"
    },
    howToUse: {
      title: "사용 방법",
      subtitle: "DivorceGPT를 최대한 활용하기 위한 빠른 팁",
      cards: [
        { title: "양식 작성", desc: "질문에 답하세요. DivorceGPT가 단계별로 문서를 준비합니다." },
        { title: "양식 참조", desc: "어떤 양식에 대해 묻고 있는지 DivorceGPT에 알려주세요 — 소장, 인증서, 최종 판결 등." },
        { title: "귀하의 언어로 질문", desc: "편한 언어로 질문하세요. 스페인어, 중국어, 한국어, 러시아어, 아이티 크레올어를 지원합니다." },
        { title: "제출에 대해 질문", desc: "양식으로 무엇을 해야 할지 모르시나요? 제출 과정, 법원 위치, 수수료 또는 다음 단계에 대해 질문하세요." }
      ]
    },
    howItWorks: {
      title: "작동 방식",
      subtitle: "두 단계. 질문에 답하고, 문서를 제출하면 끝.",
      steps: [
        { title: "자격 확인", desc: "몇 가지 질문에 답하여 이 서비스가 적합한지 확인하세요." },
        { title: "$29 결제", desc: "일회성 결제. 숨겨진 수수료 없음. 구독 없음." },
        { title: "양식 받기", desc: "제출 준비가 완료된 이혼 양식을 받으세요." },
        { title: "질문하기", desc: "DivorceGPT를 사용하여 과정의 모든 부분을 이해하세요." }
      ]
    },
    eligibilitySection: {
      title: "이것이 적합한가요?",
      subtitle: "이 서비스는 다음 조건의 뉴저지 무분쟁 이혼을 위한 것입니다:",
      items: [
        "18세 미만 자녀 없음",
        "분할할 재산이나 채무 없음",
        "배우자 부양료 요청 없음",
        "양측 모두 이혼에 동의",
        "배우자가 문서에 서명할 것임",
        "NJ 거주 12개월 이상"
      ],
      cta: "자격 확인하기"
    },
    faq: {
      title: "자주 묻는 질문",
      items: [
        { q: "이것이 법률 자문인가요?", a: "아닙니다. DivorceGPT는 이혼 양식이 무엇을 요구하는지와 제출 방법을 설명합니다. 법률 자문을 제공하지 않습니다. 법률 자문은 변호사에게 문의하세요." },
        { q: "DivorceGPT는 어떤 기술을 사용하나요?", a: "DivorceGPT는 안전한 상용 API를 통해 고급 AI 기술을 사용합니다. API 제공업체의 약관에 따라 귀하의 입력은 AI 모델 학습에 사용되지 않으며 며칠 내에 자동 삭제됩니다. June Guided Solutions, LLC(DivorceGPT 운영 회사)는 채팅 기록이나 대화 데이터를 일절 보관하지 않습니다. 지원이 필요한 경우 대화 스크린샷을 직접 제공해야 합니다 — 저희는 대화를 복구할 수 없습니다." },
        { q: "절차는 얼마나 걸리나요?", a: "양식은 몇 분 안에 완료할 수 있지만 전체 이혼 절차에는 시간이 걸립니다. 법원이 각 단계 사이에 제출물을 처리해야 합니다. 기간은 카운티에 따라 다릅니다. 세션은 12개월 동안 유효합니다." },
        { q: "세션에 어떻게 접근하나요?", a: "결제 후 세션 페이지로 리디렉션됩니다. 이 페이지를 북마크하세요 — URL이 접근 링크입니다. 계정이나 비밀번호가 없습니다." },
        { q: "배우자가 협조하지 않으면 어떻게 하나요?", a: "이 서비스는 양측이 동의하는 무분쟁 이혼을 위한 것입니다. 배우자가 협조하지 않으면 분쟁 이혼 변호사가 필요할 수 있습니다." },
        { q: "환불받을 수 있나요?", a: "자격 확인 후 자격이 안 되면 청구되지 않습니다. 양식이 생성되면 환불할 수 없습니다." }
      ]
    },
    qualify: {
      title: "자격 확인",
      subtitle: "이 질문에 답하여 이 서비스가 귀하의 상황에 적합한지 확인하세요.",
      successTitle: "자격이 됩니다!",
      successMsg: "귀하의 답변에 따르면 뉴저지 무분쟁 이혼 서비스를 이용할 자격이 있습니다.",
      failTitle: "자격 미달",
      failMsg: "귀하의 답변에 따르면 이 서비스가 귀하의 상황에 적합하지 않을 수 있습니다.",
      reasons: "이유:",
      consult: "귀하의 특정 상황에 대해 가정법 변호사와 상담해야 할 수 있습니다.",
      yes: "예",
      no: "아니오",
      submit: "자격 확인",
      continue: "결제로 계속",
      back: "홈으로 돌아가기",
      questions: {
        residency: { q: "배우자 중 최소 한 명이 뉴저지에 최소 12개월 연속 거주했나요?", d: "NJ는 제출 전 최소 한 쪽이 12개월 연속 거주해야 합니다." },
        children: { q: "결혼에서 미성년 자녀가 있나요, 또는 현재 임신 중인가요?", d: "자립하지 못하는 18세 미만 자녀를 포함합니다. 배우자 중 한 명이 현재 임신 중이면 예라고 답해야 합니다." },
        property: { q: "분할할 재산, 채무, 연금 또는 퇴직 계좌가 있나요?", d: "부동산, 401(k), 큰 채무 등." },
        support: { q: "배우자 중 누가 배우자 부양료를 요청하고 있나요?", d: "현재 또는 미래에." },
        uncontested: { q: "양측 모두 이혼에 동의하며, 필요한 서류 서명에 협조할 것인가요?", d: "양측 모두 이혼을 원하며, 상대 배우자가 공증인 앞에서 송달 확인서에 서명할 것입니다." },
        military: { q: "배우자가 현재 미국 군대에서 복무하고 있나요?", d: "현역, 현역 명령의 예비군, 또는 연방 활성화된 주 방위군." },
        domesticViolence: { q: "귀하와 배우자 사이에 가정 폭력 사건, 접근 금지 명령 또는 보호 명령이 있었나요?", d: "현재 또는 과거의 임시 접근 금지 명령, 최종 접근 금지 명령, 보호 명령 또는 가정 폭력 고소를 포함합니다 — 기각되거나 철회된 경우에도." }
      },
      militaryDisqualification: "DivorceGPT는 배우자가 현재 미국 군대에서 복무하는 경우 문서를 준비할 수 없습니다.\n\n현역 군인은 군인 민사 구제법(SCRA)에 따라 결석 판결 보호를 포함한 특별 법적 보호를 받습니다.\n\n군사 이혼 사건을 처리하는 가정법 변호사와 상담하시기 바랍니다.",
      dvDisqualification: "DivorceGPT는 당사자 간 가정 폭력 이력이 있는 경우 문서를 준비할 수 없습니다.\n\n가정 폭력 사건은 이 문서 준비 서비스의 범위를 벗어나는 법적 복잡성을 만듭니다.\n\n명령이 기각되었거나 만료된 경우에도 이력은 법원 양식에 공개해야 합니다.\n\n가정 폭력 문제에 경험이 있는 가정법 변호사와 상담하시기 바랍니다. 위험에 처해 있다면 전국 가정 폭력 핫라인 1-800-799-7233으로 연락하세요.",
      disclosure: {
        title: "DivorceGPT의 기능",
        description: "DivorceGPT는 문서 준비 서비스입니다. 뉴저지 고등법원 형평법부 — 가정부에서 요구하는 공식 양식을 사용합니다.",
        serviceTitle: "서비스 내용:",
        services: [
          "귀하의 답변을 필요한 양식에 입력합니다",
          "각 양식 필드가 요청하는 정보를 식별하는 쉬운 언어 레이블을 표시합니다",
          "제출 전 검토할 PDF 패키지를 생성합니다"
        ],
        disclaimer: "DivorceGPT는 귀하의 답변의 법적 충분성을 검토하지 않으며, 법률 자문을 제공하지 않으며, 법정에서 귀하를 대리하지 않습니다.",
        freeFormsTitle: "무료 양식 이용 가능",
        freeFormsDesc: "공식 이혼 양식은 뉴저지 법원 웹사이트(njcourts.gov)에서 이용할 수 있습니다. DivorceGPT는 작성을 자동화합니다 — 항상 직접 무료로 제출할 수 있습니다.",
        continueButton: "DivorceGPT 계속 사용($29)"
      },
      fields: {
        plaintiffName: { label: "원고 이름", desc: "제출자" },
        defendantName: { label: "피고 이름", desc: "상대 배우자" },
        filingCounty: { label: "제출 카운티", desc: "제출 장소" },
        residencyBasis: { label: "거주 근거", desc: "누가 자격이 있는지" },
        qualifyingAddress: { label: "자격 주소", desc: "거주 주소" },
        phone: { label: "전화번호", desc: "법원 연락처" },
        plaintiffAddress: { label: "원고 주소", desc: "우편 주소" },
        defendantAddress: { label: "피고 주소", desc: "송달 주소" },
        ceremonyType: { label: "결혼식 유형", desc: "민사 또는 종교" },
        indexNumber: { label: "사건 번호", desc: "서기로부터" },
        summonsDate: { label: "제출 날짜", desc: "소장 제출 날짜" },
        marriageDate: { label: "결혼 날짜", desc: "결혼 시기" },
        marriageCity: { label: "결혼 도시", desc: "결혼 장소" },
        marriageCounty: { label: "결혼 카운티", desc: "결혼한 카운티" },
        marriageState: { label: "결혼 주", desc: "주/국가" },
        breakdownDate: { label: "별거 날짜", desc: "화해 불가능한 차이" },
        entryDate: { label: "판결 등록 날짜", desc: "최종 판결 등록 날짜" },
        currentAddress: { label: "현재 주소", desc: "우편용" },
        summonsWithNotice: "이혼 소장"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "양식 도우미",
      welcome: "DivorceGPT에 오신 것을 환영합니다",
      intro: "뉴저지 이혼 양식, 요구 사항 및 제출 방법을 설명해 드릴 수 있습니다.",
      placeholder: "이혼 양식에 대해 질문하세요...",
      disclaimer: "DivorceGPT는 양식과 절차를 설명하며 오류가 있을 수 있습니다. 이것은 법률 자문이 아닙니다.",
      suggestions: [
        "이혼 소장이란 무엇인가요?",
        "Bergen 카운티에서 어떻게 제출하나요?",
        "제출 수수료는 얼마인가요?",
        "화해 불가능한 차이란 무엇인가요?"
      ]
    },
    forms: {
      hidePanel: "패널 숨기기",
      showPanel: "패널 표시",
      sessionActive: "세션 활성",
      complete: "완료",
      phase: "단계",
      commence: "시작",
      submit: "제출",
      finalize: "마무리",
      forms: "양식",
      divorceWorkflow: "이혼 워크플로우",
      needHelp: "도움이 필요하세요?",
      askInChat: "채팅에서 질문하세요!",
      allDone: "모두 완료!",
      askQuestions: "제출, 절차 또는 양식에 대해 질문하세요.",
      downloadUD1: "소장 다운로드",
      downloadPackage: "패키지 다운로드",
      downloadFinalForms: "최종 양식 다운로드",
      generating: "생성 중...",
      haveIndexNumber: "사건 번호가 있습니다 → 단계 2",
      judgmentEntered: "판결 등록됨 → 단계 3",
      startOver: "다시 시작",
      goBackPhase1: "← 단계 1로 돌아가기",
      goBackPhase2: "← 단계 2로 돌아가기",
      hidePanelContinue: "패널 숨기고 채팅 계속",
      typeAnswer: "답변을 입력하세요...",
      askAnything: "양식에 대해 무엇이든 질문하세요..."
    },
    legal: {
      privacyTitle: "개인정보 처리방침",
      termsTitle: "서비스 약관",
      lastUpdated: "최종 업데이트: 2026년 1월 25일",
      backHome: "홈으로 돌아가기",
      officialNotice: "공식 통지: 아래의 법적 구속력 있는 조건은 뉴저지 주법과의 정확성을 보장하기 위해 영어로 제시됩니다.",
      sections: {
        agreement: "약관 동의",
        advice: "중요: 법률 자문이 아님",
        service: "서비스 설명",
        eligibility: "자격",
        ai: "AI 생성 콘텐츠",
        payment: "결제 및 환불",
        liability: "책임 제한",
        contact: "연락처"
      }
    }
  },
  ru: {
    hero: {
      title: "Бесспорный развод в Нью-Джерси",
      subtitle: "Просто и понятно",
      description: "Получите подготовленные формы развода с объяснениями на понятном языке. Адвокат не нужен для простых бесспорных дел.",
      cta: "Проверьте соответствие",
      fee: "$29 единоразовый платёж • Без скрытых расходов"
    },
    howToUse: {
      title: "Как использовать",
      subtitle: "Быстрые советы по максимальному использованию DivorceGPT",
      cards: [
        { title: "Создайте формы", desc: "Ответьте на вопросы. DivorceGPT подготовит документы шаг за шагом." },
        { title: "Ссылайтесь на формы", desc: "Сообщите DivorceGPT, о какой форме вы спрашиваете — Исковое заявление, Сертификации, Окончательное решение и т.д." },
        { title: "Спрашивайте на вашем языке", desc: "Просто спрашивайте на удобном вам языке. Мы поддерживаем испанский, китайский, корейский, русский и гаитянский креольский." },
        { title: "Спросите о подаче", desc: "Не знаете, что делать с формами? Спросите о процессе подачи, расположении судов, сборах или следующих шагах." }
      ]
    },
    howItWorks: {
      title: "Как это работает",
      subtitle: "Две фазы. Ответьте на вопросы, подайте документы, готово.",
      steps: [
        { title: "Проверка соответствия", desc: "Ответьте на несколько вопросов, чтобы подтвердить, что этот сервис вам подходит." },
        { title: "Оплатите $29", desc: "Единоразовый платёж. Без скрытых сборов. Без подписок." },
        { title: "Получите формы", desc: "Получите подготовленные формы развода, готовые к подаче." },
        { title: "Задавайте вопросы", desc: "Используйте DivorceGPT для понимания любой части процесса." }
      ]
    },
    eligibilitySection: {
      title: "Подходит ли это вам?",
      subtitle: "Этот сервис для бесспорных разводов в Нью-Джерси с:",
      items: [
        "Нет детей до 18 лет",
        "Нет имущества или долгов для раздела",
        "Нет требований алиментов",
        "Оба супруга согласны на развод",
        "Супруг(а) подпишет документы",
        "Проживание в NJ 12+ месяцев"
      ],
      cta: "Проверьте соответствие"
    },
    faq: {
      title: "Часто задаваемые вопросы",
      items: [
        { q: "Это юридическая консультация?", a: "Нет. DivorceGPT объясняет, что требуют формы развода и как их подать. Он не предоставляет юридических консультаций. За юридической консультацией обращайтесь к адвокату." },
        { q: "Какая технология используется?", a: "DivorceGPT использует передовую технологию ИИ через безопасный коммерческий API. Согласно условиям нашего поставщика API, ваши данные не используются для обучения моделей ИИ и автоматически удаляются в течение нескольких дней. June Guided Solutions, LLC (компания, стоящая за DivorceGPT) не хранит историю чатов или данные разговоров. Если вам нужна поддержка, вы должны предоставить собственный снимок экрана — у нас нет возможности восстановить разговор." },
        { q: "Сколько времени занимает процесс?", a: "Заполнить формы можно за минуты, но весь процесс развода требует времени. Суду нужно обработать подачи между фазами. Сроки зависят от округа. Ваша сессия действительна 12 месяцев." },
        { q: "Как получить доступ к сессии?", a: "После оплаты вы будете перенаправлены на страницу сессии. Добавьте её в закладки — URL является ссылкой доступа. Нет аккаунтов или паролей." },
        { q: "Что если супруг(а) не сотрудничает?", a: "Этот сервис для бесспорных разводов, где оба супруга согласны. Если супруг(а) не сотрудничает, вам может понадобиться адвокат по спорным разводам." },
        { q: "Можно ли получить возврат?", a: "Если вы не соответствуете требованиям после проверки, с вас не будет взиматься плата. После создания форм возврат невозможен." }
      ]
    },
    qualify: {
      title: "Проверьте соответствие",
      subtitle: "Ответьте на эти вопросы, чтобы подтвердить, что сервис подходит для вашей ситуации.",
      successTitle: "Вы соответствуете!",
      successMsg: "На основании ваших ответов вы имеете право на наш сервис бесспорного развода в Нью-Джерси.",
      failTitle: "Не соответствует",
      failMsg: "На основании ваших ответов этот сервис может не подходить для вашей ситуации.",
      reasons: "Причины:",
      consult: "Вам может потребоваться консультация адвоката по семейному праву.",
      yes: "Да",
      no: "Нет",
      submit: "Проверить соответствие",
      continue: "Перейти к оплате",
      back: "На главную",
      questions: {
        residency: { q: "Проживал ли хотя бы один из супругов в Нью-Джерси непрерывно не менее 12 месяцев?", d: "NJ требует 12 месяцев непрерывного проживания хотя бы одной стороны до подачи." },
        children: { q: "Есть ли несовершеннолетние дети от брака, или кто-либо из сторон в настоящее время беременен?", d: "Включает детей до 18 лет, которые не являются самостоятельными. Если один из супругов беременен, необходимо ответить Да." },
        property: { q: "Есть ли имущество, долги, пенсии или пенсионные счета для раздела?", d: "Недвижимость, 401(k), крупные долги и т.д." },
        support: { q: "Кто-либо из супругов просит алименты?", d: "Сейчас или в будущем." },
        uncontested: { q: "Согласны ли оба супруга на развод и будут ли оба сотрудничать при подписании необходимых документов?", d: "Обе стороны хотят развода, и другой супруг подпишет Подтверждение вручения перед нотариусом." },
        military: { q: "Служит ли ваш(а) супруг(а) в настоящее время в вооружённых силах США?", d: "Действующая служба, резерв на активных приказах или Национальная гвардия на федеральной активации." },
        domesticViolence: { q: "Были ли случаи домашнего насилия, запретительные ордера или охранные ордера между вами и вашим(ей) супругом(ой)?", d: "Включая текущие или прошлые TRO, окончательные запретительные ордера, охранные ордера или жалобы на домашнее насилие — даже если они были отклонены или отозваны." }
      },
      militaryDisqualification: "DivorceGPT не может подготовить документы для дел, когда супруг(а) служит в вооружённых силах США.\n\nВоеннослужащие имеют специальную правовую защиту по Закону о гражданской помощи военнослужащим (SCRA).\n\nРекомендуем обратиться к адвокату по семейному праву, специализирующемуся на военных разводах.",
      dvDisqualification: "DivorceGPT не может подготовить документы для дел с историей домашнего насилия.\n\nДела о домашнем насилии создают юридические сложности, выходящие за рамки данного сервиса.\n\nДаже если ордер был отклонён или истёк, эта информация должна быть раскрыта в судебных формах.\n\nРекомендуем обратиться к адвокату по семейному праву. Если вы в опасности, звоните на Национальную горячую линию по домашнему насилию: 1-800-799-7233.",
      disclosure: {
        title: "Что делает DivorceGPT",
        description: "DivorceGPT — это сервис подготовки документов. Он использует официальные формы Верховного суда Нью-Джерси, Канцелярское отделение — Семейная часть.",
        serviceTitle: "Сервис:",
        services: [
          "Переносит ваши ответы на требуемые формы",
          "Отображает понятные пояснения к каждому полю формы",
          "Создаёт PDF-пакет для вашей проверки перед подачей"
        ],
        disclaimer: "DivorceGPT не проверяет юридическую достаточность ваших ответов, не даёт юридических консультаций и не представляет вас в суде.",
        freeFormsTitle: "Бесплатные формы доступны",
        freeFormsDesc: "Официальные формы развода доступны на сайте судов Нью-Джерси (njcourts.gov). DivorceGPT автоматизирует заполнение — вы всегда можете подать их сами бесплатно.",
        continueButton: "Продолжить с DivorceGPT ($29)"
      },
      fields: {
        plaintiffName: { label: "Имя истца", desc: "Лицо, подающее иск" },
        defendantName: { label: "Имя ответчика", desc: "Другой супруг" },
        filingCounty: { label: "Округ подачи", desc: "Где подавать" },
        residencyBasis: { label: "Основание проживания", desc: "Кто соответствует" },
        qualifyingAddress: { label: "Квалификационный адрес", desc: "Адрес проживания" },
        phone: { label: "Телефон", desc: "Контакт суда" },
        plaintiffAddress: { label: "Адрес истца", desc: "Почтовый адрес" },
        defendantAddress: { label: "Адрес ответчика", desc: "Адрес вручения" },
        ceremonyType: { label: "Тип церемонии", desc: "Гражданская или религиозная" },
        indexNumber: { label: "Номер дела", desc: "От секретаря" },
        summonsDate: { label: "Дата подачи", desc: "Дата подачи искового заявления" },
        marriageDate: { label: "Дата брака", desc: "Когда поженились" },
        marriageCity: { label: "Город брака", desc: "Где поженились" },
        marriageCounty: { label: "Округ брака", desc: "Округ бракосочетания" },
        marriageState: { label: "Штат брака", desc: "Штат/Страна" },
        breakdownDate: { label: "Дата разделения", desc: "Непримиримые разногласия" },
        entryDate: { label: "Дата вынесения решения", desc: "Дата регистрации окончательного решения" },
        currentAddress: { label: "Текущий адрес", desc: "Для почты" },
        summonsWithNotice: "Исковое заявление о разводе"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Помощник по формам",
      welcome: "Добро пожаловать в DivorceGPT",
      intro: "Я могу помочь объяснить ваши формы развода в Нью-Джерси, что они требуют и как их подать.",
      placeholder: "Спросите о ваших формах развода...",
      disclaimer: "DivorceGPT объясняет формы и процедуры и может содержать ошибки. Это не юридическая консультация.",
      suggestions: [
        "Что такое исковое заявление о разводе?",
        "Как подать в округе Берген?",
        "Какие сборы за подачу?",
        "Что такое непримиримые разногласия?"
      ]
    },
    forms: {
      hidePanel: "Скрыть панель",
      showPanel: "Показать панель",
      sessionActive: "Сессия активна",
      complete: "Завершено",
      phase: "Фаза",
      commence: "Начать",
      submit: "Отправить",
      finalize: "Завершить",
      forms: "ФОРМЫ",
      divorceWorkflow: "ПРОЦЕСС РАЗВОДА",
      needHelp: "Нужна помощь?",
      askInChat: "Спросите в чате!",
      allDone: "Всё готово!",
      askQuestions: "Задавайте вопросы о подаче, процедурах или формах.",
      downloadUD1: "Скачать заявление",
      downloadPackage: "Скачать пакет",
      downloadFinalForms: "Скачать финальные формы",
      generating: "Создание...",
      haveIndexNumber: "У меня есть номер дела → Фаза 2",
      judgmentEntered: "Решение вынесено → Фаза 3",
      startOver: "Начать заново",
      goBackPhase1: "← Вернуться к Фазе 1",
      goBackPhase2: "← Вернуться к Фазе 2",
      hidePanelContinue: "Скрыть панель и продолжить чат",
      typeAnswer: "Введите ваш ответ...",
      askAnything: "Спросите что угодно о ваших формах..."
    },
    legal: {
      privacyTitle: "Политика конфиденциальности",
      termsTitle: "Условия обслуживания",
      lastUpdated: "Последнее обновление: 25 января 2026",
      backHome: "На главную",
      officialNotice: "ОФИЦИАЛЬНОЕ УВЕДОМЛЕНИЕ: Юридически обязывающие условия ниже представлены на английском языке для обеспечения точности в соответствии с законодательством штата Нью-Джерси.",
      sections: {
        agreement: "Соглашение об условиях",
        advice: "Важно: Не юридическая консультация",
        service: "Описание сервиса",
        eligibility: "Соответствие",
        ai: "Контент, созданный ИИ",
        payment: "Оплата и возврат",
        liability: "Ограничение ответственности",
        contact: "Свяжитесь с нами"
      }
    }
  },
  ht: {
    hero: {
      title: "Divòs San Kontestasyon nan New Jersey",
      subtitle: "Fè Senp",
      description: "Jwenn fòm divòs ou yo prepare ak esplike nan lang senp. Pa bezwen avoka pou ka senp san kontestasyon.",
      cta: "Tcheke Si Ou Kalifye",
      fee: "$29 peman yon sèl fwa • Pa gen frè kache"
    },
    howToUse: {
      title: "Kijan Pou Itilize",
      subtitle: "Konsèy rapid pou tire pi bon pati nan DivorceGPT",
      cards: [
        { title: "Kreye Fòm Ou Yo", desc: "Reponn kesyon yo. DivorceGPT prepare dokiman ou yo etap pa etap." },
        { title: "Referans Fòm Ou Yo", desc: "Di DivorceGPT sou ki fòm ou ap poze kesyon — Plent, Sètifikasyon, Jijman Final, elatriye." },
        { title: "Mande nan Lang Ou", desc: "Jis mande nan lang ou pi alèz la. Nou sipòte Panyòl, Chinwa, Koreyen, Ris, ak Kreyòl Ayisyen." },
        { title: "Mande sou Depoze", desc: "Pa konnen kisa pou fè ak fòm ou yo? Mande sou pwosesis depo, kote tribinal yo, frè, oswa kisa ki vini apre." }
      ]
    },
    howItWorks: {
      title: "Kijan Li Fonksyone",
      subtitle: "De faz. Reponn kesyon, depoze dokiman ou yo, fini.",
      steps: [
        { title: "Tcheke Elijiblite", desc: "Reponn kèk kesyon pou konfime sèvis sa a bon pou ou." },
        { title: "Peye $29", desc: "Peman yon sèl fwa. Pa gen frè kache. Pa gen abònman." },
        { title: "Jwenn Fòm Ou Yo", desc: "Resevwa fòm divòs ou yo prepare pare pou depoze." },
        { title: "Poze Kesyon", desc: "Itilize DivorceGPT pou konprann nenpòt pati nan pwosesis la." }
      ]
    },
    eligibilitySection: {
      title: "Èske Sa Bon Pou Ou?",
      subtitle: "Sèvis sa a se pou divòs san kontestasyon nan New Jersey ak:",
      items: [
        "Pa gen timoun anba 18 an",
        "Pa gen pwopriyete oswa dèt pou separe",
        "Pa gen demann sipò konjigal",
        "Tou de konjwen dakò pou divòse",
        "Konjwen ap siyen dokiman yo",
        "12+ mwa rezidans nan NJ"
      ],
      cta: "Tcheke Elijiblite Ou"
    },
    faq: {
      title: "Kesyon Yo Poze Souvan",
      items: [
        { q: "Èske sa se konsèy legal?", a: "Non. DivorceGPT esplike kisa fòm divòs yo mande ak kijan pou depoze yo. Li pa bay konsèy legal. Pou konsèy legal, konsilte yon avoka." },
        { q: "Ki teknoloji DivorceGPT itilize?", a: "DivorceGPT itilize teknoloji AI avanse atravè yon API komèsyal sekirize. Dapre kondisyon founisè API nou an, done ou yo pa itilize pou fòme modèl AI epi yo otomatikman efase nan kèk jou. June Guided Solutions, LLC (konpayi dèyè DivorceGPT) pa kenbe okenn istwa chat oswa done konvèsasyon. Si ou bezwen sipò, ou dwe bay pwòp ekran ou — nou pa gen okenn fason pou rekipere konvèsasyon an." },
        { q: "Konbyen tan pwosesis la pran?", a: "Ou ka ranpli fòm ou yo nan kèk minit, men pwosesis divòs la pran tan. Tribinal la bezwen trete depo yo ant chak faz. Tan an varye pa konte. Sesyon ou rete valab pou 12 mwa." },
        { q: "Kijan mwen aksede sesyon mwen?", a: "Apre peman, ou pral redirije nan paj sesyon ou. Make paj sa a kòm favori — URL la se lyen aksè ou. Pa gen kont oswa modpas." },
        { q: "E si konjwen mwen pa vle kolabore?", a: "Sèvis sa a se pou divòs san kontestasyon kote tou de konjwen dakò. Si konjwen ou pa kolabore, ou ka bezwen yon avoka divòs konteste." },
        { q: "Èske mwen ka jwenn ranbousman?", a: "Si ou pa kalifye apre verifikasyon elijiblite a, ou pa p ap peye. Yon fwa fòm yo jenere, ranbousman pa disponib." }
      ]
    },
    qualify: {
      title: "Tcheke Elijiblite Ou",
      subtitle: "Reponn kesyon sa yo pou konfime sèvis sa a bon pou sitiyasyon ou.",
      successTitle: "Ou Kalifye!",
      successMsg: "Dapre repons ou yo, ou elijib pou sèvis divòs san kontestasyon nan New Jersey nou an.",
      failTitle: "Pa Elijib",
      failMsg: "Dapre repons ou yo, sèvis sa a ka pa bon pou sitiyasyon ou.",
      reasons: "Rezon:",
      consult: "Ou ka bezwen konsilte yon avoka nan lwa fanmi pou sitiyasyon espesifik ou.",
      yes: "Wi",
      no: "Non",
      submit: "Tcheke Elijiblite",
      continue: "Kontinye nan Peman",
      back: "Tounen Lakay",
      questions: {
        residency: { q: "Èske omwen youn nan konjwen yo te viv nan New Jersey san rete pou omwen 12 mwa?", d: "NJ mande 12 mwa rezidans san rete pa omwen youn nan pati yo anvan depo." },
        children: { q: "Èske gen timoun nan maryaj la ki poko granmoun, oswa èske youn nan pati yo ansent kounye a?", d: "Sa gen ladan timoun ki poko gen 18 an ki pa ka pran swen tèt yo. Si youn nan mari oswa madanm yo ansent, ou dwe reponn Wi." },
        property: { q: "Èske gen byen, dèt, pansyon, oswa kont retrèt pou pataje?", d: "Kay, tè, 401(k), gwo dèt, elatriye." },
        support: { q: "Èske youn nan konjwen yo ap mande sipò konjigal?", d: "Swa kounye a oswa nan lavni." },
        uncontested: { q: "Èske tou de konjwen yo dakò ak divòs la epi èske tou de ap kowopere pou siyen dokiman ki nesesè yo?", d: "Tou de pati yo vle divòs la epi lòt konjwen an pral siyen Rekonesans Sèvis devan yon notè." },
        military: { q: "Èske konjwen ou ap sèvi nan lame Etazini kounye a?", d: "Sèvis aktif, rezèv sou lòd aktif, oswa Gad Nasyonal sou aktivasyon federal." },
        domesticViolence: { q: "Èske te gen nenpòt ka vyolans domestik, lòd restriksyon, oswa lòd pwoteksyon ant ou menm ak konjwen ou?", d: "Sa gen ladan nenpòt TRO aktyèl oswa pase, lòd restriksyon final, lòd pwoteksyon, oswa plent vyolans domestik — menm si li te rejte oswa retire." }
      },
      militaryDisqualification: "DivorceGPT pa ka prepare dokiman pou ka kote yon konjwen ap sèvi nan lame Etazini kounye a.\n\nManm sèvis aktif yo gen pwoteksyon legal espesyal anba Lwa sou Sekou Sivil pou Manm Sèvis (SCRA).\n\nNou rekòmande pou konsilte yon avoka nan lwa fanmi ki jere ka divòs militè.",
      dvDisqualification: "DivorceGPT pa ka prepare dokiman pou ka ki gen istwa vyolans domestik ant pati yo.\n\nKa vyolans domestik kreye konplikasyon legal ki pa nan domèn sèvis sa a.\n\nMenm si lòd la te rejte oswa ekspire, istwa a dwe divilge sou fòm tribinal yo.\n\nNou rekòmande pou konsilte yon avoka nan lwa fanmi ki gen eksperyans nan kesyon vyolans domestik. Si ou an danje, kontakte Liy Nasyonal Vyolans Domestik nan 1-800-799-7233.",
      disclosure: {
        title: "Kisa DivorceGPT Fè",
        description: "DivorceGPT se yon sèvis preparasyon dokiman. Li itilize fòm ofisyèl Tribinal Siperyè New Jersey, Divizyon Chanselri — Pati Fanmi egzije.",
        serviceTitle: "Sèvis la:",
        services: [
          "Transfere repons ou yo sou fòm ki obligatwa yo",
          "Montre etikèt nan lang senp ki idantifye ki enfòmasyon chak chan fòm mande",
          "Jenere yon pakè PDF pou ou revize anvan ou depoze"
        ],
        disclaimer: "DivorceGPT pa revize repons ou yo pou wè si yo sifi legalman, pa bay konsèy legal, oswa pa reprezante ou nan tribinal.",
        freeFormsTitle: "Fòm Gratis Disponib",
        freeFormsDesc: "Fòm ofisyèl divòs disponib nan sit entènèt Tribinal New Jersey (njcourts.gov). DivorceGPT otomatize ranplisaj — ou ka toujou depoze yo gratis poukont ou.",
        continueButton: "Kontinye ak DivorceGPT ($29)"
      },
      fields: {
        plaintiffName: { label: "Non Pleyan", desc: "Moun ki depoze" },
        defendantName: { label: "Non Defandè", desc: "Lòt konjwen" },
        filingCounty: { label: "Konte Depo", desc: "Ki kote pou depoze" },
        residencyBasis: { label: "Baz Rezidans", desc: "Ki moun ki kalifye" },
        qualifyingAddress: { label: "Adrès Kalifikasyon", desc: "Adrès rezidans" },
        phone: { label: "Telefòn", desc: "Kontak tribinal" },
        plaintiffAddress: { label: "Adrès Pleyan", desc: "Adrès postal" },
        defendantAddress: { label: "Adrès Defandè", desc: "Adrès sèvis" },
        ceremonyType: { label: "Tip Seremoni", desc: "Sivil oswa Relijye" },
        indexNumber: { label: "Nimewo Dosye", desc: "Nan sekretè" },
        summonsDate: { label: "Dat Depoze", desc: "Dat Plent te depoze nan tribinal" },
        marriageDate: { label: "Dat Maryaj", desc: "Ki lè ou te marye" },
        marriageCity: { label: "Vil Maryaj", desc: "Ki kote ou te marye" },
        marriageCounty: { label: "Konte Maryaj", desc: "Konte kote ou te marye" },
        marriageState: { label: "Eta Maryaj", desc: "Eta/Peyi" },
        breakdownDate: { label: "Dat Separasyon", desc: "Diferans ki pa ka regle" },
        entryDate: { label: "Dat Antre Jijman", desc: "Dat grefye te anrejistre jijman final" },
        currentAddress: { label: "Adrès Aktyèl", desc: "Pou lapòs" },
        summonsWithNotice: "Plent pou Divòs"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Asistan Fòm",
      welcome: "Byenveni nan DivorceGPT",
      intro: "Mwen ka ede esplike fòm divòs New Jersey ou yo, kisa yo mande, ak kijan pou depoze yo.",
      placeholder: "Mande sou fòm divòs ou yo...",
      disclaimer: "DivorceGPT esplike fòm ak pwosedi epi li ka gen erè. Sa a se pa konsèy legal.",
      suggestions: [
        "Kisa Plent pou Divòs la ye?",
        "Kijan pou mwen depoze nan Bergen County?",
        "Kisa frè yo ye?",
        "Kisa 'diferans ki pa ka regle' vle di?"
      ]
    },
    forms: {
      hidePanel: "Kache Panno",
      showPanel: "Montre Panno",
      sessionActive: "Sesyon aktif",
      complete: "Fini",
      phase: "Etap",
      commence: "Kòmanse",
      submit: "Soumèt",
      finalize: "Finalize",
      forms: "FÒM",
      divorceWorkflow: "PWOSESIS DIVÒS",
      needHelp: "Bezwen èd?",
      askInChat: "Mande nan chat la!",
      allDone: "Tout fini!",
      askQuestions: "Poze kesyon sou depo, pwosedi, oswa fòm.",
      downloadUD1: "Telechaje Plent",
      downloadPackage: "Telechaje Pakèt",
      downloadFinalForms: "Telechaje Dènye Fòm yo",
      generating: "Ap kreye...",
      haveIndexNumber: "Mwen gen Nimewo Dosye mwen → Etap 2",
      judgmentEntered: "Jijman Anrejistre → Etap 3",
      startOver: "Rekòmanse",
      goBackPhase1: "← Retounen nan Etap 1",
      goBackPhase2: "← Retounen nan Etap 2",
      hidePanelContinue: "Kache Panno epi Kontinye Chat",
      typeAnswer: "Tape repons ou...",
      askAnything: "Mande nenpòt bagay sou fòm ou yo..."
    },
    legal: {
      privacyTitle: "Règleman Konfidansyalite",
      termsTitle: "Kondisyon Sèvis",
      lastUpdated: "Dènye aktyalizasyon: 25 Janvye 2026",
      backHome: "Tounen Lakay",
      officialNotice: "AVI OFISYÈL: Tèm legal ki anba yo parèt an Anglè pou asire presizyon avèk lalwa Eta New Jersey.",
      sections: {
        agreement: "Akò sou Kondisyon yo",
        advice: "Enpòtan: Se Pa Konsèy Legal",
        service: "Deskripsyon Sèvis la",
        eligibility: "Elijiblite",
        ai: "Kontni AI Jenere",
        payment: "Peman ak Ranbousman",
        liability: "Limit Responsablite",
        contact: "Kontakte Nou"
      }
    }
  }
};
