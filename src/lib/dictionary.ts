export type Locale = 'en' | 'es' | 'zh' | 'ko' | 'ru' | 'ht';

export const dictionary = {
  en: {
    hero: {
      title: "New York Uncontested Divorce",
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
        { title: "Reference Your Forms", desc: "Look at the bottom left corner of your form for the ID (UD-1, UD-3, etc.). Tell DivorceGPT which form you're asking about." },
        { title: "Ask in Your Language", desc: "Just ask in whatever language you're comfortable with. We support Spanish, Chinese, Korean, Russian, and Haitian Creole." },
        { title: "Ask About Filing", desc: "Not sure what to do with your forms? Ask about the filing process, court locations, fees, or what happens next." }
      ]
    },
    howItWorks: {
      title: "How It Works",
      subtitle: "Four simple steps to complete your divorce",
      steps: [
        { title: "Check Eligibility", desc: "Answer a few questions to confirm this service is right for you." },
        { title: "Pay $29", desc: "One-time payment. No hidden fees. No subscriptions." },
        { title: "Get Your Forms", desc: "Receive your prepared divorce forms ready for filing." },
        { title: "Ask Questions", desc: "Use DivorceGPT to understand any part of the process." }
      ]
    },
    eligibilitySection: {
      title: "Is This Right For You?",
      subtitle: "This service is for New York uncontested divorces with:",
      items: [
        "No children of the marriage",
        "No property or debts to divide",
        "No spousal support requests",
        "Both spouses agree to divorce",
        "Spouse will cooperate with paperwork",
        "At least one spouse meets NY residency"
      ],
      cta: "Check Your Eligibility"
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "Is this legal advice?", a: "No. DivorceGPT explains what divorce forms ask for and how to file them. It does not provide legal advice. For legal advice, consult an attorney." },
        { q: "What technology powers DivorceGPT?", a: "DivorceGPT uses Claude AI combined with custom legal document guardrails for New York filings. Your conversations are not stored." },
        { q: "How long does the process take?", a: "You can complete your forms in one session. After filing, New York courts typically process uncontested divorces in 2-4 months. Your session remains valid for 12 months." },
        { q: "How do I access my session?", a: "After payment, you'll be redirected to your session page. Bookmark this page — the URL is your access link. There are no accounts or passwords. You can also find this link in your Stripe receipt email." },
        { q: "What if my spouse won't cooperate?", a: "This service is for uncontested divorces where both spouses agree. If your spouse won't cooperate, you may need a contested divorce attorney." },
        { q: "Can I regenerate my documents?", a: "Each phase allows one document generation. When you download your forms, save them immediately. Documents cannot be regenerated once downloaded." },
        { q: "Can I get a refund?", a: "If you don't qualify after the eligibility check, you won't be charged. Once forms are generated, refunds are not available." }
      ]
    },
    qualify: {
      title: "Check Your Eligibility",
      subtitle: "Answer these questions to confirm this service is right for your situation.",
      successTitle: "You Qualify!",
      successMsg: "Based on your answers, you're eligible for our New York uncontested divorce service.",
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
        residency: { q: "Does at least one spouse meet New York's residency requirement?", d: "Either spouse lived in NY for 2+ years, OR 1+ year with a connection." },
        children: { q: "Are there any unemancipated children of the marriage?", d: "Includes children under 21 who are not self-supporting." },
        property: { q: "Is there any property, debts, pensions, or retirement accounts to divide?", d: "Real estate, 401(k), large debts, etc." },
        support: { q: "Is either spouse asking for spousal maintenance (alimony)?", d: "Either now or in the future." },
        uncontested: { q: "Is the divorce uncontested and do both spouses agree to end the marriage?", d: "Both parties want the divorce and agree on all terms." },
        cooperation: { q: "Will the other spouse cooperate with signing or service of papers?", d: "Spouse will sign acknowledgment or accept service." },
        military: { q: "Is your spouse currently serving in the U.S. military?", d: "Active duty, reserves on active orders, or National Guard on federal activation." }
      },
      militaryDisqualification: "DivorceGPT cannot prepare documents for cases where a spouse is currently serving in the U.S. military.\n\nActive duty service members have special legal protections under the Servicemembers Civil Relief Act (SCRA), including protections against default judgments. These cases require additional procedural steps and court oversight that fall outside the scope of this document preparation service.\n\nWe recommend consulting with a family law attorney who handles military divorce cases.",
      disclosure: {
        title: "What DivorceGPT Does",
        description: "DivorceGPT is a document preparation service. It uses the official forms promulgated by the New York State Unified Court System.",
        serviceTitle: "The service:",
        services: [
          "Transfers your answers onto the required forms",
          "Displays plain-language labels identifying what information each form field requests",
          "Generates a PDF packet for your review before filing"
        ],
        disclaimer: "DivorceGPT does not review your answers for legal sufficiency, provide legal advice, or represent you in court.",
        freeFormsTitle: "Free Forms Available",
        freeFormsDesc: "Official uncontested divorce forms are available from the New York State Unified Court System website.",
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
        indexNumber: { label: "Index Number", desc: "From clerk" },
        summonsDate: { label: "Filing Date", desc: "Date UD-1 was filed with clerk" },
        marriageDate: { label: "Marriage Date", desc: "When married" },
        marriageCity: { label: "Marriage City", desc: "Where married" },
        marriageCounty: { label: "Marriage County", desc: "County where married" },
        marriageState: { label: "Marriage State", desc: "State/Country" },
        breakdownDate: { label: "Breakdown Date", desc: "DRL §170(7)" },
        entryDate: { label: "Judgment Entry Date", desc: "Date clerk entered JOD (not signing date)" },
        currentAddress: { label: "Current Address", desc: "For mailing" },
        summonsWithNotice: "Summons with Notice"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Form Assistant",
      welcome: "Welcome to DivorceGPT",
      intro: "I can help explain your New York divorce forms, what they ask for, and how to file them.",
      placeholder: "Ask about your divorce forms...",
      disclaimer: "DivorceGPT explains forms and procedures and may contain errors. This is not legal advice.",
      suggestions: [
        "What is form UD-1?",
        "How do I file in Queens?",
        "What are filing fees?",
        "What is 'irretrievable breakdown'?"
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
      downloadUD1: "Download UD-1",
      downloadPackage: "Download Package",
      downloadFinalForms: "Download Final Forms",
      generating: "Generating...",
      haveIndexNumber: "I have my Index Number → Phase 2",
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
      officialNotice: "OFFICIAL NOTICE: The legally binding terms below are presented in English to ensure accuracy with New York State law.",
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
      title: "Divorcio de Mutuo Acuerdo en NY",
      subtitle: "Simplificado",
      description: "Prepare y entienda sus formularios de divorcio en lenguaje sencillo. No necesita abogados para casos simples y sin disputa.",
      cta: "Verifique Si Califica",
      fee: "Tarifa única de $29 • Sin costos ocultos"
    },
    howToUse: {
      title: "Cómo Usar",
      subtitle: "Consejos rápidos para aprovechar DivorceGPT",
      cards: [
        { title: "Cree sus Formularios", desc: "Responda las preguntas. DivorceGPT prepara sus documentos paso a paso." },
        { title: "Consulte sus Formularios", desc: "Mire la esquina inferior izquierda de su formulario para ver el ID (UD-1, UD-3, etc.). Dígale a DivorceGPT sobre qué formulario pregunta." },
        { title: "Pregunte en su Idioma", desc: "Pregunte en el idioma que prefiera. Apoyamos español, chino, coreano, ruso y criollo haitiano." },
        { title: "Pregunte sobre la Presentación", desc: "¿No sabe qué hacer con sus formularios? Pregunte sobre el proceso de presentación, ubicaciones de la corte o tarifas." }
      ]
    },
    howItWorks: {
      title: "Cómo Funciona",
      subtitle: "Cuatro pasos simples para completar su divorcio",
      steps: [
        { title: "Verificar Elegibilidad", desc: "Responda unas preguntas para confirmar que este servicio es para usted." },
        { title: "Pagar $29", desc: "Pago único. Sin cargos ocultos. Sin suscripciones." },
        { title: "Obtener Formularios", desc: "Reciba sus formularios de divorcio listos para presentar." },
        { title: "Hacer Preguntas", desc: "Use DivorceGPT para entender cualquier parte del proceso." }
      ]
    },
    eligibilitySection: {
      title: "¿Es Esto Para Usted?",
      subtitle: "Este servicio es para divorcios de mutuo acuerdo en NY con:",
      items: [
        "Sin hijos del matrimonio",
        "Sin propiedades o deudas para dividir",
        "Sin solicitud de manutención conyugal",
        "Ambos cónyuges aceptan el divorcio",
        "El cónyuge cooperará con los documentos",
        "Al menos un cónyuge cumple con la residencia de NY"
      ],
      cta: "Verifique su Elegibilidad"
    },
    faq: {
      title: "Preguntas Frecuentes",
      items: [
        { q: "¿Es esto asesoramiento legal?", a: "No. DivorceGPT explica qué piden los formularios y cómo presentarlos. No proporciona asesoramiento legal. Para ello, consulte a un abogado." },
        { q: "¿Qué tecnología usa DivorceGPT?", a: "DivorceGPT utiliza Claude AI combinado con protecciones de documentos legales personalizadas para presentaciones en Nueva York." },
        { q: "¿Cuánto tiempo toma el proceso?", a: "Puede completar sus formularios en una sesión. Después de presentar, las cortes de NY suelen procesar divorcios de mutuo acuerdo en 2-4 meses." },
        { q: "¿Qué pasa si mi cónyuge no coopera?", a: "Este servicio es para divorcios donde ambos están de acuerdo. Si su cónyuge no coopera, puede necesitar un abogado para divorcio contencioso." },
        { q: "¿Puedo obtener un reembolso?", a: "Si no califica después de la verificación, no se le cobrará. Una vez generados los formularios, no hay reembolsos." }
      ]
    },
    qualify: {
      title: "Verifique su Elegibilidad",
      subtitle: "Responda estas preguntas para confirmar que este servicio es adecuado.",
      successTitle: "¡Usted Califica!",
      successMsg: "Según sus respuestas, es elegible para nuestro servicio de divorcio de mutuo acuerdo.",
      failTitle: "No Elegible",
      failMsg: "Según sus respuestas, este servicio puede no ser adecuado para su situación.",
      reasons: "Razones:",
      consult: "Es posible que necesite consultar con un abogado de derecho familiar.",
      yes: "Sí",
      no: "No",
      submit: "Verificar Elegibilidad",
      continue: "Continuar al Pago",
      back: "Volver al Inicio",
      questions: {
        residency: { q: "¿Cumple al menos un cónyuge con el requisito de residencia de Nueva York?", d: "Uno de los cónyuges vivió en NY por más de 2 años, O más de 1 año con conexión." },
        children: { q: "¿Hay hijos no emancipados del matrimonio?", d: "Incluye hijos menores de 21 años que no son económicamente independientes." },
        property: { q: "¿Hay propiedades, deudas, pensiones o cuentas de jubilación para dividir?", d: "Bienes raíces, 401(k), deudas grandes, etc." },
        support: { q: "¿Alguno de los cónyuges está solicitando manutención (pensión alimenticia)?", d: "Ya sea ahora o en el futuro." },
        uncontested: { q: "¿El divorcio es de mutuo acuerdo y ambos cónyuges aceptan terminar el matrimonio?", d: "Ambas partes quieren el divorcio y están de acuerdo en todos los términos." },
        cooperation: { q: "¿Cooperará el otro cónyuge firmando o aceptando los documentos?", d: "El cónyuge firmará el reconocimiento o aceptará la notificación (Service of Process)." },
        military: { q: "¿Su cónyuge está actualmente sirviendo en el ejército de EE.UU.?", d: "Servicio activo, reservas en órdenes activas, o Guardia Nacional en activación federal." }
      },
      militaryDisqualification: "DivorceGPT no puede preparar documentos para casos donde un cónyuge está actualmente sirviendo en el ejército de EE.UU.\n\nLos miembros del servicio activo tienen protecciones legales especiales bajo la Ley de Alivio Civil para Miembros del Servicio (SCRA), incluyendo protecciones contra sentencias en rebeldía. Estos casos requieren pasos procesales adicionales y supervisión judicial que están fuera del alcance de este servicio de preparación de documentos.\n\nRecomendamos consultar con un abogado de derecho familiar que maneje casos de divorcio militar.",
      disclosure: {
        title: "Qué Hace DivorceGPT",
        description: "DivorceGPT es un servicio de preparación de documentos. Utiliza los formularios oficiales promulgados por el Sistema de Tribunales Unificados del Estado de Nueva York.",
        serviceTitle: "El servicio:",
        services: [
          "Transfiere sus respuestas a los formularios requeridos",
          "Muestra etiquetas en lenguaje sencillo identificando qué información solicita cada campo",
          "Genera un paquete PDF para su revisión antes de presentar"
        ],
        disclaimer: "DivorceGPT no revisa sus respuestas para suficiencia legal, no proporciona asesoramiento legal, ni lo representa en la corte.",
        freeFormsTitle: "Formularios Gratuitos Disponibles",
        freeFormsDesc: "Los formularios oficiales de divorcio sin oposición están disponibles en el sitio web del Sistema de Tribunales Unificados del Estado de Nueva York.",
        continueButton: "Continuar con DivorceGPT ($29)"
      },
      fields: {
        plaintiffName: { label: "Nombre del Demandante", desc: "Persona que presenta" },
        defendantName: { label: "Nombre del Demandado", desc: "Otro cónyuge" },
        filingCounty: { label: "Condado de Presentación", desc: "Dónde presentar" },
        residencyBasis: { label: "Base de Residencia", desc: "Quién califica" },
        qualifyingAddress: { label: "Dirección de Calificación", desc: "Dirección de residencia" },
        phone: { label: "Teléfono", desc: "Contacto del tribunal" },
        plaintiffAddress: { label: "Dirección del Demandante", desc: "Dirección postal" },
        defendantAddress: { label: "Dirección del Demandado", desc: "Dirección de servicio" },
        ceremonyType: { label: "Tipo de Ceremonia", desc: "Civil o Religiosa" },
        indexNumber: { label: "Número de Índice", desc: "Del secretario" },
        summonsDate: { label: "Fecha de Presentación", desc: "Fecha en que se presentó UD-1" },
        marriageDate: { label: "Fecha de Matrimonio", desc: "Cuándo se casaron" },
        marriageCity: { label: "Ciudad del Matrimonio", desc: "Dónde se casaron" },
        marriageCounty: { label: "Condado del Matrimonio", desc: "Condado donde se casaron" },
        marriageState: { label: "Estado del Matrimonio", desc: "Estado/País" },
        breakdownDate: { label: "Fecha de Ruptura", desc: "DRL §170(7)" },
        entryDate: { label: "Fecha de Entrada del Juicio", desc: "Fecha en que el secretario registró (no fecha de firma)" },
        currentAddress: { label: "Dirección Actual", desc: "Para correo" },
        summonsWithNotice: "Citación con Aviso"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Asistente de Formularios",
      welcome: "Bienvenido a DivorceGPT",
      intro: "Puedo ayudarle a explicar sus formularios de divorcio de NY y cómo presentarlos.",
      placeholder: "Pregunte sobre sus formularios...",
      disclaimer: "DivorceGPT explica formularios y procedimientos. No es asesoramiento legal.",
      suggestions: [
        "¿Qué es el formulario UD-1?",
        "¿Cómo presento en Queens?",
        "¿Cuáles son las tarifas?",
        "¿Qué significa 'ruptura irreparable'?"
      ]
    },
    forms: {
      hidePanel: "Ocultar Panel",
      showPanel: "Mostrar Panel",
      sessionActive: "Sesión activa",
      complete: "Completo",
      phase: "Fase",
      commence: "Iniciar",
      submit: "Enviar",
      finalize: "Finalizar",
      forms: "FORMULARIOS",
      divorceWorkflow: "PROCESO DE DIVORCIO",
      needHelp: "¿Necesita ayuda?",
      askInChat: "¡Pregunte en el chat!",
      allDone: "¡Todo listo!",
      askQuestions: "Pregunte sobre presentación, procedimientos o formularios.",
      downloadUD1: "Descargar UD-1",
      downloadPackage: "Descargar Paquete",
      downloadFinalForms: "Descargar Formularios Finales",
      generating: "Generando...",
      haveIndexNumber: "Tengo mi Número de Índice → Fase 2",
      judgmentEntered: "Sentencia Registrada → Fase 3",
      startOver: "Empezar de nuevo",
      goBackPhase1: "← Volver a Fase 1",
      goBackPhase2: "← Volver a Fase 2",
      hidePanelContinue: "Ocultar Panel y Continuar Chateando",
      typeAnswer: "Escriba su respuesta...",
      askAnything: "Pregunte lo que quiera sobre sus formularios..."
    },
    legal: {
      privacyTitle: "Política de Privacidad",
      termsTitle: "Términos de Servicio",
      lastUpdated: "Última actualización: 25 de enero de 2026",
      backHome: "Volver al Inicio",
      officialNotice: "AVISO OFICIAL: Los términos legalmente vinculantes a continuación se presentan en inglés para garantizar la precisión con la ley del estado de Nueva York.",
      sections: {
        agreement: "Acuerdo de Términos",
        advice: "Importante: No es Asesoramiento Legal",
        service: "Descripción del Servicio",
        eligibility: "Elegibilidad",
        ai: "Contenido Generado por IA",
        payment: "Pagos y Reembolsos",
        liability: "Limitación de Responsabilidad",
        contact: "Contáctenos"
      }
    }
  },
  zh: {
    hero: {
      title: "纽约无争议离婚",
      subtitle: "简单易办",
      description: "用通俗易懂的语言准备并解释您的离婚表格。简单无争议的案件无需律师。",
      cta: "检查您是否符合资格",
      fee: "一次性费用 $29 • 无隐藏费用"
    },
    howToUse: {
      title: "如何使用",
      subtitle: "使用 DivorceGPT 的快速提示",
      cards: [
        { title: "创建您的表格", desc: "回答问题。DivorceGPT 逐步为您准备文件。" },
        { title: "参考您的表格", desc: "查看表格左下角的 ID（UD-1, UD-3 等）。告诉 DivorceGPT 您要咨询哪个表格。" },
        { title: "使用您的语言", desc: "请使用您熟悉的语言提问。我们支持中文、西班牙语、韩语、俄语和海地克里奥尔语。" },
        { title: "咨询提交流程", desc: "不确定如何处理表格？询问关于提交流程、法院地点或费用的问题。" }
      ]
    },
    howItWorks: {
      title: "操作流程",
      subtitle: "完成离婚的四个简单步骤",
      steps: [
        { title: "资格检查", desc: "回答几个问题以确认此服务适合您。" },
        { title: "支付 $29", desc: "一次性付款。无隐藏费用。无订阅。" },
        { title: "获取表格", desc: "接收准备好的离婚表格，即可提交。" },
        { title: "咨询提问", desc: "使用 DivorceGPT 了解流程的任何部分。" }
      ]
    },
    eligibilitySection: {
      title: "这适合您吗？",
      subtitle: "此服务适用于符合以下条件的纽约无争议离婚：",
      items: [
        "婚姻中没有子女",
        "没有财产或债务需要分配",
        "没有配偶赡养费要求",
        "双方都同意离婚",
        "配偶将配合签署文件",
        "至少一方符合纽约居住要求"
      ],
      cta: "检查您的资格"
    },
    faq: {
      title: "常见问题",
      items: [
        { q: "这是法律建议吗？", a: "不是。DivorceGPT 解释离婚表格的要求和提交方式。它不提供法律建议。如需法律建议，请咨询律师。" },
        { q: "DivorceGPT 使用什么技术？", a: "DivorceGPT 使用 Claude AI，并结合针对纽约申请的自定义法律文档护栏。" },
        { q: "这个过程需要多长时间？", a: "您可以在一次会话中完成表格。提交后，纽约法院通常在 2-4 个月内处理无争议离婚。" },
        { q: "如果我的配偶不配合怎么办？", a: "此服务适用于双方同意的无争议离婚。如果您的配偶不配合，您可能需要聘请争议离婚律师。" },
        { q: "我可以退款吗？", a: "如果您在资格检查后不符合条件，我们将不会收费。一旦生成表格，则不予退款。" }
      ]
    },
    qualify: {
      title: "检查您的资格",
      subtitle: "回答这些问题以确认此服务适合您的情况。",
      successTitle: "您符合资格！",
      successMsg: "根据您的回答，您符合我们纽约无争议离婚服务的资格。",
      failTitle: "不符合资格",
      failMsg: "根据您的回答，此服务可能不适合您的情况。",
      reasons: "原因：",
      consult: "您可能需要咨询家庭法律师。",
      yes: "是",
      no: "否",
      submit: "检查资格",
      continue: "继续付款",
      back: "返回首页",
      questions: {
        residency: { q: "至少有一方配偶符合纽约的居住要求吗？", d: "任何一方在纽约居住满2年以上，或满1年且有相关联系。" },
        children: { q: "婚姻中有未成年（未独立）的子女吗？", d: "包括21岁以下且不能自立的子女。" },
        property: { q: "是否有财产、债务、养老金或退休账户需要分配？", d: "房产、401(k)、大额债务等。" },
        support: { q: "任一配偶是否在申请配偶赡养费？", d: "无论是现在还是将来。" },
        uncontested: { q: "离婚是否无争议，且双方都同意结束婚姻？", d: "双方都想要离婚并同意所有条款。" },
        cooperation: { q: "另一方配偶是否会配合签署或接收文件？", d: "配偶将签署确认书或接受法律送达。" },
        military: { q: "您的配偶目前是否在美国军队服役？", d: "现役、现役命令下的预备役、或联邦激活的国民警卫队。" }
      },
      militaryDisqualification: "DivorceGPT 无法为配偶目前在美国军队服役的案件准备文件。\n\n现役军人根据《军人民事救济法》(SCRA) 享有特殊法律保护，包括针对缺席判决的保护。这些案件需要额外的程序步骤和法院监督，超出了本文件准备服务的范围。\n\n我们建议咨询处理军人离婚案件的家庭法律师。",
      disclosure: {
        title: "DivorceGPT 的功能",
        description: "DivorceGPT 是一项文件准备服务。它使用纽约州统一法院系统颁布的官方表格。",
        serviceTitle: "该服务：",
        services: [
          "将您的答案转移到所需的表格上",
          "显示通俗易懂的标签，说明每个表格字段要求的信息",
          "生成 PDF 文件包供您在提交前审阅"
        ],
        disclaimer: "DivorceGPT 不审查您的答案是否具有法律充分性，不提供法律建议，也不在法庭上代表您。",
        freeFormsTitle: "免费表格可用",
        freeFormsDesc: "官方无争议离婚表格可从纽约州统一法院系统网站获取。",
        continueButton: "继续使用 DivorceGPT ($29)"
      },
      fields: {
        plaintiffName: { label: "原告姓名", desc: "提交人" },
        defendantName: { label: "被告姓名", desc: "另一方配偶" },
        filingCounty: { label: "提交县", desc: "在哪里提交" },
        residencyBasis: { label: "居住依据", desc: "谁符合条件" },
        qualifyingAddress: { label: "符合条件的地址", desc: "居住地址" },
        phone: { label: "电话", desc: "法院联系方式" },
        plaintiffAddress: { label: "原告地址", desc: "邮寄地址" },
        defendantAddress: { label: "被告地址", desc: "送达地址" },
        ceremonyType: { label: "仪式类型", desc: "民事或宗教" },
        indexNumber: { label: "索引号", desc: "来自书记员" },
        summonsDate: { label: "提交日期", desc: "UD-1提交法院的日期" },
        marriageDate: { label: "结婚日期", desc: "何时结婚" },
        marriageCity: { label: "结婚城市", desc: "在哪里结婚" },
        marriageCounty: { label: "结婚县", desc: "结婚的县" },
        marriageState: { label: "结婚州", desc: "州/国家" },
        breakdownDate: { label: "破裂日期", desc: "DRL §170(7)" },
        entryDate: { label: "判决登记日期", desc: "书记员登记日期（非签署日期）" },
        currentAddress: { label: "当前地址", desc: "用于邮寄" },
        summonsWithNotice: "带通知的传票"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "表格助手",
      welcome: "欢迎使用 DivorceGPT",
      intro: "我可以协助解释您的纽约离婚表格、填写要求以及提交方式。",
      placeholder: "询问关于离婚表格的问题...",
      disclaimer: "DivorceGPT 解释表格和程序，可能包含错误。这不是法律建议。",
      suggestions: [
        "什么是 UD-1 表格？",
        "我如何在皇后区提交？",
        "申请费用是多少？",
        "什么是'婚姻关系破裂无可挽回'？"
      ]
    },
    forms: {
      hidePanel: "隐藏面板",
      showPanel: "显示面板",
      sessionActive: "会话进行中",
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
      downloadUD1: "下载 UD-1",
      downloadPackage: "下载文件包",
      downloadFinalForms: "下载最终表格",
      generating: "生成中...",
      haveIndexNumber: "我有索引号 → 阶段 2",
      judgmentEntered: "判决已登记 → 阶段 3",
      startOver: "重新开始",
      goBackPhase1: "← 返回阶段 1",
      goBackPhase2: "← 返回阶段 2",
      hidePanelContinue: "隐藏面板并继续聊天",
      typeAnswer: "输入您的答案...",
      askAnything: "询问有关表格的任何问题..."
    },
    legal: {
      privacyTitle: "隐私政策",
      termsTitle: "服务条款",
      lastUpdated: "最后更新：2026年1月25日",
      backHome: "返回首页",
      officialNotice: "正式通知：以下具有法律约束力的条款以英文列出，以确保符合纽约州法律的准确性。",
      sections: {
        agreement: "条款协议",
        advice: "重要提示：非法律建议",
        service: "服务说明",
        eligibility: "资格要求",
        ai: "AI生成内容",
        payment: "付款与退款",
        liability: "责任限制",
        contact: "联系我们"
      }
    }
  },
  ko: {
    hero: {
      title: "뉴욕 합의 이혼",
      subtitle: "간편한 절차",
      description: "이해하기 쉬운 언어로 이혼 서류를 준비하고 설명해 드립니다. 간단한 합의 이혼의 경우 변호사가 필요하지 않습니다.",
      cta: "자격 확인하기",
      fee: "$29 일회성 비용 • 숨겨진 비용 없음"
    },
    howToUse: {
      title: "이용 방법",
      subtitle: "DivorceGPT 활용 팁",
      cards: [
        { title: "서류 작성", desc: "질문에 답하세요. DivorceGPT가 단계별로 서류를 준비해 드립니다." },
        { title: "양식 참조", desc: "양식 왼쪽 하단에 있는 ID(UD-1, UD-3 등)를 확인하세요. DivorceGPT에 어떤 양식에 대해 묻는지 알려주세요." },
        { title: "모국어로 질문", desc: "편한 언어로 질문하세요. 스페인어, 중국어, 한국어, 러시아어, 아이티 크리올어를 지원합니다." },
        { title: "제출 절차 문의", desc: "양식을 어떻게 처리해야 할지 모르겠나요? 법원 제출 절차, 위치, 수수료 등에 대해 물어보세요." }
      ]
    },
    howItWorks: {
      title: "진행 절차",
      subtitle: "이혼 절차를 완료하는 4단계",
      steps: [
        { title: "자격 확인", desc: "몇 가지 질문에 답하여 서비스 이용 가능 여부를 확인하세요." },
        { title: "$29 결제", desc: "일회성 결제. 숨겨진 수수료 없음. 구독 없음." },
        { title: "서류 받기", desc: "법원에 제출할 준비가 된 이혼 서류를 받으세요." },
        { title: "질문하기", desc: "DivorceGPT를 사용하여 절차에 대해 문의하세요." }
      ]
    },
    eligibilitySection: {
      title: "이용 가능 대상인가요?",
      subtitle: "이 서비스는 다음 조건을 충족하는 뉴욕 합의 이혼을 위한 것입니다:",
      items: [
        "자녀가 없음",
        "분할할 재산이나 부채가 없음",
        "배우자 부양비 요청이 없음",
        "양측 모두 이혼에 동의함",
        "배우자가 서류 작업에 협조함",
        "적어도 한 명이 뉴욕 거주 요건을 충족함"
      ],
      cta: "자격 요건 확인하기"
    },
    faq: {
      title: "자주 묻는 질문",
      items: [
        { q: "이것은 법률 자문인가요?", a: "아니요. DivorceGPT는 이혼 서류의 내용과 제출 방법을 설명합니다. 법률 자문이 아닙니다. 법률 자문은 변호사와 상담하세요." },
        { q: "DivorceGPT는 어떤 기술을 사용하나요?", a: "DivorceGPT는 Claude AI와 뉴욕 법원 제출을 위한 맞춤형 법적 문서 가이드라인을 결합하여 사용합니다." },
        { q: "절차는 얼마나 걸리나요?", a: "한 번의 세션으로 서류를 완료할 수 있습니다. 제출 후, 뉴욕 법원은 일반적으로 2-4개월 내에 합의 이혼을 처리합니다." },
        { q: "배우자가 협조하지 않으면 어떻게 하나요?", a: "이 서비스는 양측이 동의하는 합의 이혼을 위한 것입니다. 협조하지 않을 경우, 소송 이혼 전문 변호사가 필요할 수 있습니다." },
        { q: "환불받을 수 있나요?", a: "자격 확인 후 이용 대상이 아니면 비용이 청구되지 않습니다. 서류가 생성된 후에는 환불되지 않습니다." }
      ]
    },
    qualify: {
      title: "자격 요건 확인",
      subtitle: "서비스 이용 가능 여부를 확인하려면 질문에 답하십시오.",
      successTitle: "이용 가능합니다!",
      successMsg: "답변을 바탕으로 뉴욕 합의 이혼 서비스를 이용하실 수 있습니다.",
      failTitle: "이용 불가",
      failMsg: "답변을 바탕으로 볼 때, 이 서비스는 귀하의 상황에 적합하지 않을 수 있습니다.",
      reasons: "이유:",
      consult: "가정법 변호사와 상담해야 할 수도 있습니다.",
      yes: "예",
      no: "아니요",
      submit: "자격 확인",
      continue: "결제하기",
      back: "홈으로 돌아가기",
      questions: {
        residency: { q: "배우자 중 적어도 한 명이 뉴욕 거주 요건을 충족합니까?", d: "배우자 중 한 명이 2년 이상 뉴욕 거주, 또는 1년 이상 거주하며 연고가 있음." },
        children: { q: "미성년 자녀가 있습니까?", d: "21세 미만이며 경제적으로 독립하지 않은 자녀를 포함합니다." },
        property: { q: "분할할 재산, 부채, 연금 또는 퇴직 계좌가 있습니까?", d: "부동산, 401(k), 다액의 채무 등." },
        support: { q: "배우자 중 한 명이 배우자 부양비(위자료)를 요청하고 있습니까?", d: "현재 또는 미래에." },
        uncontested: { q: "합의 이혼이며 양측 모두 결혼 생활 종료에 동의합니까?", d: "양측 모두 이혼을 원하며 모든 조건에 동의합니다." },
        cooperation: { q: "상대방 배우자가 서류 서명 또는 송달에 협조할 것입니까?", d: "배우자가 확인서에 서명하거나 법적 송달(Service)을 수락할 것입니다." },
        military: { q: "배우자가 현재 미국 군에서 복무 중입니까?", d: "현역, 현역 명령 하의 예비역, 또는 연방 활성화된 주방위군." }
      },
      militaryDisqualification: "DivorceGPT는 배우자가 현재 미국 군에서 복무 중인 경우 서류를 준비할 수 없습니다.\n\n현역 군인은 군인민사구제법(SCRA)에 따라 궐석 판결에 대한 보호를 포함한 특별한 법적 보호를 받습니다. 이러한 사건은 이 문서 준비 서비스의 범위를 벗어나는 추가적인 절차 단계와 법원 감독이 필요합니다.\n\n군인 이혼 사건을 처리하는 가정법 변호사와 상담하시기 바랍니다.",
      disclosure: {
        title: "DivorceGPT가 하는 일",
        description: "DivorceGPT는 문서 준비 서비스입니다. 뉴욕주 통합 법원 시스템에서 공포한 공식 양식을 사용합니다.",
        serviceTitle: "서비스 내용:",
        services: [
          "귀하의 답변을 필요한 양식에 전송합니다",
          "각 양식 필드가 요청하는 정보를 식별하는 일반 언어 레이블을 표시합니다",
          "제출 전 검토를 위한 PDF 패킷을 생성합니다"
        ],
        disclaimer: "DivorceGPT는 귀하의 답변이 법적으로 충분한지 검토하지 않으며, 법률 자문을 제공하거나 법정에서 귀하를 대리하지 않습니다.",
        freeFormsTitle: "무료 양식 이용 가능",
        freeFormsDesc: "공식 합의 이혼 양식은 뉴욕주 통합 법원 시스템 웹사이트에서 이용할 수 있습니다.",
        continueButton: "DivorceGPT로 계속하기 ($29)"
      },
      fields: {
        plaintiffName: { label: "원고 이름", desc: "제출하는 사람" },
        defendantName: { label: "피고 이름", desc: "다른 배우자" },
        filingCounty: { label: "제출 카운티", desc: "어디에 제출" },
        residencyBasis: { label: "거주 근거", desc: "누가 자격이 되는지" },
        qualifyingAddress: { label: "자격 주소", desc: "거주 주소" },
        phone: { label: "전화", desc: "법원 연락처" },
        plaintiffAddress: { label: "원고 주소", desc: "우편 주소" },
        defendantAddress: { label: "피고 주소", desc: "송달 주소" },
        ceremonyType: { label: "의식 유형", desc: "민사 또는 종교" },
        indexNumber: { label: "색인 번호", desc: "서기로부터" },
        summonsDate: { label: "제출 날짜", desc: "UD-1 법원 제출일" },
        marriageDate: { label: "결혼 날짜", desc: "결혼한 날" },
        marriageCity: { label: "결혼 도시", desc: "결혼한 곳" },
        marriageCounty: { label: "결혼 카운티", desc: "결혼한 카운티" },
        marriageState: { label: "결혼 주", desc: "주/국가" },
        breakdownDate: { label: "파탄 날짜", desc: "DRL §170(7)" },
        entryDate: { label: "판결 등록 날짜", desc: "서기관 등록일 (서명일 아님)" },
        currentAddress: { label: "현재 주소", desc: "우편용" },
        summonsWithNotice: "통지부 소환장"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "서류 도우미",
      welcome: "DivorceGPT에 오신 것을 환영합니다",
      intro: "뉴욕 이혼 서류의 내용과 작성 요령, 제출 방법에 대해 설명해 드릴 수 있습니다.",
      placeholder: "이혼 서류에 대해 질문하세요...",
      disclaimer: "DivorceGPT는 서류와 절차를 설명하며 오류가 있을 수 있습니다. 법률 자문이 아닙니다.",
      suggestions: [
        "UD-1 양식이 무엇인가요?",
        "퀸즈에서 어떻게 제출하나요?",
        "제출 수수료는 얼마인가요?",
        "'회복할 수 없는 파탄'이란?"
      ]
    },
    forms: {
      hidePanel: "패널 숨기기",
      showPanel: "패널 표시",
      sessionActive: "세션 활성화",
      complete: "완료",
      phase: "단계",
      commence: "시작",
      submit: "제출",
      finalize: "완료",
      forms: "서류",
      divorceWorkflow: "이혼 절차",
      needHelp: "도움이 필요하세요?",
      askInChat: "채팅에서 질문하세요!",
      allDone: "모두 완료!",
      askQuestions: "제출, 절차 또는 서류에 대해 질문하세요.",
      downloadUD1: "UD-1 다운로드",
      downloadPackage: "패키지 다운로드",
      downloadFinalForms: "최종 서류 다운로드",
      generating: "생성 중...",
      haveIndexNumber: "색인 번호가 있습니다 → 단계 2",
      judgmentEntered: "판결 등록됨 → 단계 3",
      startOver: "다시 시작",
      goBackPhase1: "← 단계 1로 돌아가기",
      goBackPhase2: "← 단계 2로 돌아가기",
      hidePanelContinue: "패널 숨기고 채팅 계속하기",
      typeAnswer: "답변을 입력하세요...",
      askAnything: "서류에 대해 무엇이든 질문하세요..."
    },
    legal: {
      privacyTitle: "개인정보 처리방침",
      termsTitle: "서비스 약관",
      lastUpdated: "최종 업데이트: 2026년 1월 25일",
      backHome: "홈으로 돌아가기",
      officialNotice: "공식 통지: 아래의 법적 구속력이 있는 약관은 뉴욕 주법의 정확성을 보장하기 위해 영어로 제공됩니다.",
      sections: {
        agreement: "약관 동의",
        advice: "중요: 법률 자문 아님",
        service: "서비스 설명",
        eligibility: "자격 요건",
        ai: "AI 생성 콘텐츠",
        payment: "결제 및 환불",
        liability: "책임의 한계",
        contact: "문의하기"
      }
    }
  },
  ru: {
    hero: {
      title: "Бесспорный развод в Нью-Йорке",
      subtitle: "Это просто",
      description: "Подготовка и разъяснение форм на простом языке. Для простых случаев без споров адвокат не нужен.",
      cta: "Проверьте право на услугу",
      fee: "Разовый платеж $29 • Без скрытых комиссий"
    },
    howToUse: {
      title: "Как использовать",
      subtitle: "Советы по использованию DivorceGPT",
      cards: [
        { title: "Создайте свои формы", desc: "Ответьте на вопросы. DivorceGPT подготовит ваши документы шаг за шагом." },
        { title: "Сверьтесь с формами", desc: "Посмотрите ID формы в левом нижнем углу (UD-1, UD-3 и т.д.). Сообщите DivorceGPT, о какой форме идет речь." },
        { title: "Спрашивайте на своем языке", desc: "Просто спросите на удобном вам языке. Мы поддерживаем испанский, китайский, корейский, русский и гаитянский креольский." },
        { title: "Спросите о подаче", desc: "Не знаете, что делать с формами? Спросите о процессе подачи, адресах судов или пошлинах." }
      ]
    },
    howItWorks: {
      title: "Как это работает",
      subtitle: "Четыре простых шага для оформления развода",
      steps: [
        { title: "Проверка права", desc: "Ответьте на вопросы, чтобы узнать, подходит ли вам этот сервис." },
        { title: "Оплата $29", desc: "Разовый платеж. Никаких подписок." },
        { title: "Получение форм", desc: "Получите готовые формы для подачи в суд." },
        { title: "Вопросы", desc: "Используйте DivorceGPT, чтобы понять процесс." }
      ]
    },
    eligibilitySection: {
      title: "Подходит ли это вам?",
      subtitle: "Этот сервис для бесспорных разводов в Нью-Йорке при условии:",
      items: [
        "Нет несовершеннолетних детей",
        "Нет имущества или долгов для раздела",
        "Нет требований об алиментах на супруга",
        "Оба супруга согласны на развод",
        "Супруг будет сотрудничать с документами",
        "Хотя бы один супруг живет в Нью-Йорке"
      ],
      cta: "Проверьте право на услугу"
    },
    faq: {
      title: "Частые вопросы",
      items: [
        { q: "Это юридическая консультация?", a: "Нет. DivorceGPT объясняет формы и процедуру подачи. Это не юридическая консультация. За советом обратитесь к адвокату." },
        { q: "Какая технология используется?", a: "DivorceGPT использует Claude AI вместе со специальными юридическими алгоритмами для документов штата Нью-Йорк." },
        { q: "Сколько времени занимает процесс?", a: "Вы можете заполнить формы за один раз. Суды Нью-Йорка обычно рассматривают бесспорные разводы 2-4 месяца." },
        { q: "Что если супруг не сотрудничает?", a: "Этот сервис для случаев, когда оба согласны. Если супруг против, вам может понадобиться адвокат для спорного развода." },
        { q: "Можно ли вернуть деньги?", a: "Если вы не пройдете проверку права, деньги не спишутся. После создания форм возврат невозможен." }
      ]
    },
    qualify: {
      title: "Проверка права на использование",
      subtitle: "Ответьте на эти вопросы, чтобы подтвердить, что услуга вам подходит.",
      successTitle: "Вы подходите!",
      successMsg: "Основываясь на ваших ответах, вы имеете право на нашу услугу бесспорного развода.",
      failTitle: "Вы не подходите",
      failMsg: "Основываясь на ваших ответах, эта услуга может вам не подойти.",
      reasons: "Причины:",
      consult: "Вам может потребоваться консультация адвоката по семейным делам.",
      yes: "Да",
      no: "Нет",
      submit: "Проверить",
      continue: "Перейти к оплате",
      back: "На главную",
      questions: {
        residency: { q: "Соблюдает ли хотя бы один супруг требования к проживанию в штате Нью-Йорк?", d: "Один из супругов прожил в NY 2+ года ИЛИ 1+ год при наличии связей." },
        children: { q: "Есть ли у вас несовершеннолетние дети?", d: "Включая детей до 21 года, которые не обеспечивают себя самостоятельно." },
        property: { q: "Есть ли имущество, долги или пенсии для раздела?", d: "Недвижимость, 401(k), крупные долги и т.д." },
        support: { q: "Требует ли кто-либо из супругов алименты на содержание супруга?", d: "Сейчас или в будущем." },
        uncontested: { q: "Является ли развод бесспорным и согласны ли оба супруга?", d: "Обе стороны хотят развода и согласны со всеми условиями." },
        cooperation: { q: "Будет ли другой супруг сотрудничать при подписании документов?", d: "Супруг подпишет подтверждение или примет вручение (Service) документов." },
        military: { q: "Служит ли ваш супруг в настоящее время в вооружённых силах США?", d: "Действующая служба, резерв на активных приказах или Национальная гвардия на федеральной активации." }
      },
      militaryDisqualification: "DivorceGPT не может подготовить документы для случаев, когда супруг в настоящее время служит в вооружённых силах США.\n\nВоеннослужащие имеют особые правовые защиты в соответствии с Законом о гражданской помощи военнослужащим (SCRA), включая защиту от заочных решений. Такие дела требуют дополнительных процессуальных шагов и судебного надзора, которые выходят за рамки данной услуги по подготовке документов.\n\nМы рекомендуем проконсультироваться с адвокатом по семейному праву, который занимается делами о разводе военнослужащих.",
      disclosure: {
        title: "Что делает DivorceGPT",
        description: "DivorceGPT — это служба подготовки документов. Она использует официальные формы, установленные Единой судебной системой штата Нью-Йорк.",
        serviceTitle: "Услуга включает:",
        services: [
          "Переносит ваши ответы в необходимые формы",
          "Отображает понятные метки, указывающие, какую информацию запрашивает каждое поле формы",
          "Создаёт PDF-пакет для вашей проверки перед подачей"
        ],
        disclaimer: "DivorceGPT не проверяет ваши ответы на юридическую достаточность, не предоставляет юридические консультации и не представляет вас в суде.",
        freeFormsTitle: "Бесплатные формы доступны",
        freeFormsDesc: "Официальные формы для бесспорного развода доступны на веб-сайте Единой судебной системы штата Нью-Йорк.",
        continueButton: "Продолжить с DivorceGPT ($29)"
      },
      fields: {
        plaintiffName: { label: "Имя истца", desc: "Лицо, подающее иск" },
        defendantName: { label: "Имя ответчика", desc: "Другой супруг" },
        filingCounty: { label: "Округ подачи", desc: "Где подавать" },
        residencyBasis: { label: "Основание проживания", desc: "Кто имеет право" },
        qualifyingAddress: { label: "Адрес проживания", desc: "Адрес резиденции" },
        phone: { label: "Телефон", desc: "Контакт суда" },
        plaintiffAddress: { label: "Адрес истца", desc: "Почтовый адрес" },
        defendantAddress: { label: "Адрес ответчика", desc: "Адрес вручения" },
        ceremonyType: { label: "Тип церемонии", desc: "Гражданская или религиозная" },
        indexNumber: { label: "Индексный номер", desc: "От секретаря" },
        summonsDate: { label: "Дата подачи", desc: "Дата подачи UD-1 в суд" },
        marriageDate: { label: "Дата брака", desc: "Когда поженились" },
        marriageCity: { label: "Город брака", desc: "Где поженились" },
        marriageCounty: { label: "Округ брака", desc: "Округ, где поженились" },
        marriageState: { label: "Штат брака", desc: "Штат/Страна" },
        breakdownDate: { label: "Дата распада", desc: "DRL §170(7)" },
        entryDate: { label: "Дата регистрации решения", desc: "Дата регистрации клерком (не дата подписи)" },
        currentAddress: { label: "Текущий адрес", desc: "Для почты" },
        summonsWithNotice: "Повестка с уведомлением"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Помощник по формам",
      welcome: "Добро пожаловать в DivorceGPT",
      intro: "Я помогу объяснить формы развода в Нью-Йорке и как их подать.",
      placeholder: "Спросите о формах...",
      disclaimer: "DivorceGPT объясняет процедуры. Это не юридическая консультация.",
      suggestions: [
        "Что такое форма UD-1?",
        "Как подать документы в Квинсе?",
        "Какие пошлины?",
        "Что такое 'непоправимый распад'?"
      ]
    },
    forms: {
      hidePanel: "Скрыть панель",
      showPanel: "Показать панель",
      sessionActive: "Сессия активна",
      complete: "Завершено",
      phase: "Этап",
      commence: "Начало",
      submit: "Отправить",
      finalize: "Завершить",
      forms: "ФОРМЫ",
      divorceWorkflow: "ПРОЦЕСС РАЗВОДА",
      needHelp: "Нужна помощь?",
      askInChat: "Спросите в чате!",
      allDone: "Всё готово!",
      askQuestions: "Задайте вопросы о подаче, процедурах или формах.",
      downloadUD1: "Скачать UD-1",
      downloadPackage: "Скачать пакет",
      downloadFinalForms: "Скачать финальные формы",
      generating: "Создание...",
      haveIndexNumber: "У меня есть индексный номер → Этап 2",
      judgmentEntered: "Решение зарегистрировано → Этап 3",
      startOver: "Начать заново",
      goBackPhase1: "← Вернуться к этапу 1",
      goBackPhase2: "← Вернуться к этапу 2",
      hidePanelContinue: "Скрыть панель и продолжить чат",
      typeAnswer: "Введите ваш ответ...",
      askAnything: "Спросите что угодно о формах..."
    },
    legal: {
      privacyTitle: "Политика конфиденциальности",
      termsTitle: "Условия использования",
      lastUpdated: "Последнее обновление: 25 января 2026",
      backHome: "На главную",
      officialNotice: "ОФИЦИАЛЬНОЕ УВЕДОМЛЕНИЕ: Юридически обязательные условия ниже представлены на английском языке для обеспечения точности в соответствии с законодательством штата Нью-Йорк.",
      sections: {
        agreement: "Соглашение с условиями",
        advice: "Важно: Не является юридической консультацией",
        service: "Описание услуги",
        eligibility: "Право на использование",
        ai: "Контент, созданный ИИ",
        payment: "Оплата и возврат",
        liability: "Ограничение ответственности",
        contact: "Связаться с нами"
      }
    }
  },
  ht: {
    hero: {
      title: "Divòs San Kontestasyon nan New York",
      subtitle: "Fè Senp",
      description: "Jwenn fòm divòs ou yo prepare epi esplike nan langaj senp. Ou pa bezwen avoka pou ka senp kote nou dakò.",
      cta: "Tcheke Si Ou Kalifye",
      fee: "Frè $29 yon sèl fwa • Pa gen lòt frè kache"
    },
    howToUse: {
      title: "Kijan Pou Itilize",
      subtitle: "Konsèy rapid pou byen itilize DivorceGPT",
      cards: [
        { title: "Kreye Fòm Ou Yo", desc: "Reponn kesyon yo. DivorceGPT prepare dokiman ou yo etap pa etap." },
        { title: "Gade Fòm Ou Yo", desc: "Gade anba agòch fòm ou an pou wè ID a (UD-1, UD-3, elatriye). Di DivorceGPT ki fòm wap mande a." },
        { title: "Mande nan Lang Ou", desc: "Jis mande nan kèlkeswa lang ou pito. Nou sipòte Panyòl, Chinwa, Koreyen, Ris, ak Kreyòl Ayisyen." },
        { title: "Mande sou Depo", desc: "Ou pa sèten kisa pou fè ak fòm ou yo? Mande sou pwosesis depo a, kote tribinal yo ye, oswa frè yo." }
      ]
    },
    howItWorks: {
      title: "Kijan Li Mache",
      subtitle: "Kat etap senp pou fini divòs ou",
      steps: [
        { title: "Tcheke Elijiblite", desc: "Reponn kèk kesyon pou wè si sèvis sa a bon pou ou." },
        { title: "Peye $29", desc: "Peman yon sèl fwa. Pa gen frè kache. Pa gen abònman." },
        { title: "Jwenn Fòm Ou Yo", desc: "Resevwa fòm divòs ou tou prepare pou depoze nan tribinal." },
        { title: "Poze Kesyon", desc: "Itilize DivorceGPT pou konprann nenpòt pati nan pwosesis la." }
      ]
    },
    eligibilitySection: {
      title: "Èske Sa Bon Pou Ou?",
      subtitle: "Sèvis sa a se pou divòs san kontestasyon nan New York avèk:",
      items: [
        "Pa gen timoun nan maryaj la",
        "Pa gen byen oswa dèt pou pataje",
        "Pa gen demann pou sipò (alimony)",
        "Tou de mari/madanm dakò divòse",
        "Lòt moun nan ap kowopere ak papye yo",
        "Omwen youn nan nou abite New York"
      ],
      cta: "Tcheke Elijiblite Ou"
    },
    faq: {
      title: "Kesyon Yo Souvan Poze",
      items: [
        { q: "Èske sa se konsèy legal?", a: "Non. DivorceGPT esplike kisa fòm divòs yo mande ak kijan pou depoze yo. Li pa bay konsèy legal. Pou konsèy legal, konsilte yon avoka." },
        { q: "Ki teknoloji DivorceGPT itilize?", a: "DivorceGPT itilize Claude AI ansanm ak règ dokiman legal espesyal pou depo nan New York." },
        { q: "Konbyen tan pwosesis la pran?", a: "Ou ka fini fòm ou yo nan yon sèl fwa. Apre ou depoze, tribinal New York anjeneral trete divòs san kontestasyon nan 2-4 mwa." },
        { q: "Kisa si mari/madanm mwen pa kowopere?", a: "Sèvis sa a se pou lè nou tou de dakò. Si mari/madanm ou pa kowopere, ou ka bezwen yon avoka pou divòs ki gen kontestasyon." },
        { q: "Èske mwen ka jwenn ranbousman?", a: "Si ou pa kalifye apre tcheke a, nou pap chaje ou. Yon fwa fòm yo fin fèt, pa gen ranbousman." }
      ]
    },
    qualify: {
      title: "Tcheke Elijiblite Ou",
      subtitle: "Reponn kesyon sa yo pou konfime sèvis sa a bon pou sitiyasyon ou.",
      successTitle: "Ou Kalifye!",
      successMsg: "Dapre repons ou yo, ou elijib pou sèvis divòs san kontestasyon New York nou an.",
      failTitle: "Pa Elijib",
      failMsg: "Dapre repons ou yo, sèvis sa a ka pa bon pou sitiyasyon ou.",
      reasons: "Rezon:",
      consult: "Ou ka bezwen konsilte yon avoka lalwa fanmi pou sitiyasyon espesifik ou.",
      yes: "Wi",
      no: "Non",
      submit: "Tcheke Elijiblite",
      continue: "Kontinye pou Peye",
      back: "Tounen Lakay",
      questions: {
        residency: { q: "Èske omwen youn nan mari oswa madanm yo satisfè kondisyon rezidans New York?", d: "Youn nan mari oswa madanm yo te viv nan NY pou 2+ ane, OSWA 1+ ane avèk koneksyon." },
        children: { q: "Èske gen timoun nan maryaj la ki poko granmoun?", d: "Sa gen ladan timoun ki poko gen 21 an ki pa ka pran swen tèt yo." },
        property: { q: "Èske gen byen, dèt, pansyon, oswa kont retrèt pou pataje?", d: "Kay, tè, 401(k), gwo dèt, elatriye." },
        support: { q: "Èske youn nan mari oswa madanm yo ap mande sipò (alimony)?", d: "Swa kounye a oswa nan lavni." },
        uncontested: { q: "Èske divòs la san kontestasyon epi èske nou tou de dakò pou fini maryaj la?", d: "Tou de pati yo vle divòs la epi yo dakò sou tout kondisyon yo." },
        cooperation: { q: "Èske lòt mari oswa madanm nan ap kowopere pou siyen oswa resevwa papye yo?", d: "Mari oswa madanm nan pral siyen papye yo oswa aksepte sèvis la (Service of Process)." },
        military: { q: "Èske mari oswa madanm ou ap sèvi nan lame Etazini kounye a?", d: "Sèvis aktif, rezèv sou lòd aktif, oswa Gad Nasyonal sou aktivasyon federal." }
      },
      militaryDisqualification: "DivorceGPT pa ka prepare dokiman pou ka kote yon mari oswa madanm ap sèvi nan lame Etazini kounye a.\n\nManm sèvis aktif yo gen pwoteksyon legal espesyal anba Lwa sou Sekou Sivil pou Manm Sèvis (SCRA), ki gen ladan pwoteksyon kont jijman pa defo. Ka sa yo mande etap pwosedi adisyonèl ak sipèvizyon tribinal ki pa nan domèn sèvis preparasyon dokiman sa a.\n\nNou rekòmande pou konsilte yon avoka nan lwa fanmi ki jere ka divòs militè.",
      disclosure: {
        title: "Kisa DivorceGPT Fè",
        description: "DivorceGPT se yon sèvis preparasyon dokiman. Li itilize fòm ofisyèl ki pibliye pa Sistèm Tribinal Inifye Eta New York.",
        serviceTitle: "Sèvis la:",
        services: [
          "Transfere repons ou yo sou fòm ki obligatwa yo",
          "Montre etikèt nan lang senp ki idantifye ki enfòmasyon chak chan fòm mande",
          "Jenere yon pakè PDF pou ou revize anvan ou depoze"
        ],
        disclaimer: "DivorceGPT pa revize repons ou yo pou wè si yo sifi legalman, pa bay konsèy legal, oswa pa reprezante ou nan tribinal.",
        freeFormsTitle: "Fòm Gratis Disponib",
        freeFormsDesc: "Fòm ofisyèl divòs san kontestasyon disponib nan sit entènèt Sistèm Tribinal Inifye Eta New York.",
        continueButton: "Kontinye ak DivorceGPT ($29)"
      },
      fields: {
        plaintiffName: { label: "Non Pleyan", desc: "Moun ki depoze" },
        defendantName: { label: "Non Defandè", desc: "Lòt mari/madanm" },
        filingCounty: { label: "Konte Depo", desc: "Ki kote pou depoze" },
        residencyBasis: { label: "Baz Rezidans", desc: "Ki moun ki kalifye" },
        qualifyingAddress: { label: "Adrès Kalifikasyon", desc: "Adrès rezidans" },
        phone: { label: "Telefòn", desc: "Kontak tribinal" },
        plaintiffAddress: { label: "Adrès Pleyan", desc: "Adrès postal" },
        defendantAddress: { label: "Adrès Defandè", desc: "Adrès sèvis" },
        ceremonyType: { label: "Tip Seremoni", desc: "Sivil oswa Relijye" },
        indexNumber: { label: "Nimewo Endèks", desc: "Nan sekretè" },
        summonsDate: { label: "Dat Depoze", desc: "Dat UD-1 te depoze nan tribinal" },
        marriageDate: { label: "Dat Maryaj", desc: "Ki lè ou te marye" },
        marriageCity: { label: "Vil Maryaj", desc: "Ki kote ou te marye" },
        marriageCounty: { label: "Konte Maryaj", desc: "Konte kote ou te marye" },
        marriageState: { label: "Eta Maryaj", desc: "Eta/Peyi" },
        breakdownDate: { label: "Dat Kase", desc: "DRL §170(7)" },
        entryDate: { label: "Dat Antre Jijman", desc: "Dat grefye te anrejistre (pa dat siyen)" },
        currentAddress: { label: "Adrès Aktyèl", desc: "Pou lapòs" },
        summonsWithNotice: "Sitasyon ak Avi"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Asistan Fòm",
      welcome: "Byenveni nan DivorceGPT",
      intro: "Mwen ka ede esplike fòm divòs NY ou yo, kisa yo mande, ak kijan pou depoze yo.",
      placeholder: "Mande sou fòm divòs ou yo...",
      disclaimer: "DivorceGPT esplike fòm ak pwosedi epi li ka gen erè. Sa a se pa konsèy legal.",
      suggestions: [
        "Kisa fòm UD-1 lan ye?",
        "Kijan pou mwen depoze nan Queens?",
        "Kisa frè yo ye?",
        "Kisa 'maryaj kraze ki pa ka ranje' vle di?"
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
      downloadUD1: "Telechaje UD-1",
      downloadPackage: "Telechaje Pakèt",
      downloadFinalForms: "Telechaje Dènye Fòm yo",
      generating: "Ap kreye...",
      haveIndexNumber: "Mwen gen Nimewo Endèks mwen → Etap 2",
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
      officialNotice: "AVI OFISYÈL: Tèm legal ki anba yo parèt an Anglè pou asire presizyon avèk lalwa Eta New York.",
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
