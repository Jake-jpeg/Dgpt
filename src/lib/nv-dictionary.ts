import { Locale } from './ny-dictionary';

// NV uses: en, es, zh, ko, tl (Tagalog replaces ru/ht for NV demographics)
// The Locale type from ny-dictionary has en/es/zh/ko/ru/ht
// We reuse en/es/zh/ko and map tl to the 'ht' slot since NV doesn't use Haitian Creole
// This avoids changing the global Locale type. The language selector UI will show "Tagalog" for NV.

export const nvDictionary: Record<string, any> = {
  en: {
    hero: {
      title: "Nevada Uncontested Divorce",
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
        { title: "Reference Your Forms", desc: "Tell DivorceGPT which form you're asking about — Joint Petition, Decree, Affidavit, etc." },
        { title: "Ask in Your Language", desc: "Just ask in whatever language you're comfortable with. We support Spanish, Chinese, Korean, and Tagalog." },
        { title: "Ask About Filing", desc: "Not sure what to do with your forms? Ask about the filing process, court locations, fees, or what happens next." }
      ]
    },
    howItWorks: {
      title: "How It Works",
      subtitle: "One phase. Answer questions, file your documents, done.",
      steps: [
        { title: "Check Eligibility", desc: "Answer a few questions to confirm this service is right for you." },
        { title: "Pay $29", desc: "One-time payment. No hidden fees. No subscriptions." },
        { title: "Get Your Forms", desc: "Receive your complete filing packet ready for notarization and filing." },
        { title: "Ask Questions", desc: "Use DivorceGPT to understand any part of the process." }
      ]
    },
    eligibilitySection: {
      title: "Is This Right For You?",
      subtitle: "This service is for Nevada uncontested divorces with:",
      items: [
        "Filing in Clark County or Washoe County",
        "No minor children and neither party is pregnant",
        "No undivided community property or debt",
        "No spousal support requested",
        "Both spouses agree to divorce",
        "At least one spouse: 6 weeks in NV",
        "NV resident witness available",
        "Neither spouse is active military"
      ],
      cta: "Check Your Eligibility"
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "Is this legal advice?", a: "No. DivorceGPT explains what divorce forms ask for and how to file them. It does not provide legal advice. For legal advice, consult an attorney." },
        { q: "What technology powers DivorceGPT?", a: "DivorceGPT uses Anthropic's Claude AI via their commercial API. Under Anthropic's API terms, your inputs are not used for AI model training and are automatically deleted within days. June Guided Solutions, LLC (the company behind DivorceGPT) does not retain any chat history or conversation data. If you need support, you must provide your own screenshot of the conversation — we have no way to retrieve it." },
        { q: "How long does the process take?", a: "Clark County: typically 1-4 weeks. Washoe County: the judge has up to 60 days. There is no mandatory waiting period in Nevada." },
        { q: "How do I access my session?", a: "After payment, you'll be redirected to your session page. Bookmark this page — the URL is your access link. There are no accounts or passwords." },
        { q: "What if my spouse won't cooperate?", a: "This service is for uncontested divorces where both spouses agree. If your spouse won't cooperate, you may need a contested divorce attorney." },
        { q: "Can I get a refund?", a: "If you don't qualify after the eligibility check, you won't be charged. Once forms are generated, refunds are not available." }
      ]
    },
    qualify: {
      title: "Check Your Eligibility",
      subtitle: "Answer these questions to confirm this service is right for your situation.",
      successTitle: "You Qualify!",
      successMsg: "Based on your answers, you're eligible for our Nevada uncontested divorce service.",
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
        county: { q: "Are you filing in Clark County (Las Vegas) or Washoe County (Reno)?", d: "DivorceGPT currently serves Clark and Washoe counties only." },
        residency: { q: "Has at least one spouse lived in Nevada for at least 6 weeks?", d: "Nevada requires at least one spouse to have been a bona fide resident for 6 weeks before filing (NRS 125.020)." },
        witness: { q: "Do you have a Nevada resident who can serve as a witness?", d: "You need a third-party Nevada resident (not a spouse) who can attest to the filing spouse's NV residency." },
        children: { q: "Do you have any minor children (under 18), or is either party currently pregnant?", d: "DivorceGPT only handles divorces with no minor children and where neither spouse is currently pregnant." },
        property: { q: "Do you have community property or debt that still needs to be divided?", d: "If all property and debt have already been divided by agreement, or if there is none, you may still qualify." },
        support: { q: "Is either spouse seeking spousal support (alimony)?", d: "DivorceGPT only handles cases where neither party requests alimony." },
        uncontested: { q: "Do both spouses agree to the divorce and will both cooperate with signing the required documents?", d: "Both spouses must agree and be willing to sign the Joint Petition and Decree before a notary." },
        military: { q: "Is either spouse currently on active military duty?", d: "Active duty military members have additional legal protections (SCRA) that require attorney representation." },
        domesticViolence: { q: "Is there any history of domestic violence between the spouses?", d: "This includes any protective orders (active or expired), DV complaints, or police involvement for domestic incidents." }
      },
      militaryDisqualification: "DivorceGPT cannot prepare documents for cases where a spouse is currently serving in the U.S. military.\n\nActive duty service members have special legal protections under the Servicemembers Civil Relief Act (SCRA). These cases require additional procedural steps that fall outside the scope of this document preparation service.\n\nWe recommend consulting with a family law attorney who handles military divorce cases.",
      dvDisqualification: "DivorceGPT cannot prepare documents for cases involving domestic violence history between the parties.\n\nDomestic violence cases create legal complexities that fall outside the scope of this document preparation service.\n\nWe recommend consulting with a family law attorney experienced in domestic violence matters. If you are in danger, contact the National Domestic Violence Hotline at 1-800-799-7233.",
      disclosure: {
        title: "What DivorceGPT Does",
        description: "DivorceGPT is a document preparation service for Nevada Joint Petition divorces.",
        serviceTitle: "The service:",
        services: [
          "Transfers your answers onto the required forms",
          "Displays plain-language labels identifying what information each form field requests",
          "Generates a PDF packet for your review before filing"
        ],
        disclaimer: "DivorceGPT does not review your answers for legal sufficiency, provide legal advice, or represent you in court.",
        freeFormsTitle: "Free Forms Available",
        freeFormsDesc: "Official divorce forms are available from the Nevada Self-Help Center (selfhelp.nvcourts.gov) and the Clark County Family Law Self-Help Center.",
        continueButton: "Continue with DivorceGPT ($29)"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Form Assistant",
      welcome: "Welcome to DivorceGPT",
      intro: "I can help explain your Nevada divorce forms, what they ask for, and how to file them.",
      placeholder: "Ask about your divorce forms...",
      disclaimer: "DivorceGPT explains forms and procedures and may contain errors. This is not legal advice.",
      suggestions: [
        "What is the Joint Petition?",
        "How do I file in Clark County?",
        "What is the Affidavit of Resident Witness?",
        "Do my forms need to be notarized?"
      ]
    },
    forms: {
      hidePanel: "Hide Panel",
      showPanel: "Show Panel",
      sessionActive: "Session active",
      complete: "Complete",
      phase: "Phase",
      commence: "Filing",
      submit: "Submit",
      finalize: "Finalize",
      forms: "FORMS",
      divorceWorkflow: "DIVORCE WORKFLOW",
      needHelp: "Need help?",
      askInChat: "Just ask in the chat!",
      allDone: "All done!",
      askQuestions: "Ask questions about filing, procedures, or forms.",
      downloadUD1: "Download Filing Packet",
      downloadPackage: "Download Package",
      downloadFinalForms: "Download Final Forms",
      generating: "Generating...",
      startOver: "Start over",
      hidePanelContinue: "Hide Panel & Continue Chatting",
      typeAnswer: "Type your answer...",
      askAnything: "Ask me anything about your forms..."
    },
    legal: {
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms of Service",
      lastUpdated: "Last updated: March 11, 2026",
      backHome: "Back to Home",
      officialNotice: "OFFICIAL NOTICE: The legally binding terms below are presented in English to ensure accuracy with Nevada State law.",
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
      title: "Divorcio No Disputado en Nevada",
      subtitle: "Simplificado",
      description: "Prepare sus formularios de divorcio con explicaciones en lenguaje sencillo. No se necesitan abogados para casos simples y no disputados.",
      cta: "Verifique Si Califica",
      fee: "Tarifa única de $29 • Sin costos ocultos"
    },
    howToUse: {
      title: "Cómo Usar",
      subtitle: "Consejos rápidos para aprovechar DivorceGPT al máximo",
      cards: [
        { title: "Cree Sus Formularios", desc: "Responda las preguntas. DivorceGPT prepara sus documentos paso a paso." },
        { title: "Consulte Sus Formularios", desc: "Dígale a DivorceGPT sobre qué formulario pregunta — Petición Conjunta, Decreto, Declaración Jurada, etc." },
        { title: "Pregunte en Su Idioma", desc: "Pregunte en el idioma que prefiera. Ofrecemos soporte en español, chino, coreano y tagalo." },
        { title: "Pregunte Sobre el Proceso", desc: "¿No está seguro qué hacer con sus formularios? Pregunte sobre el proceso de presentación, ubicaciones del tribunal, tarifas o los próximos pasos." }
      ]
    },
    howItWorks: {
      title: "Cómo Funciona",
      subtitle: "Una fase. Responda preguntas, presente sus documentos, listo.",
      steps: [
        { title: "Verifique Elegibilidad", desc: "Responda algunas preguntas para confirmar que este servicio es adecuado para usted." },
        { title: "Pague $29", desc: "Pago único. Sin tarifas ocultas. Sin suscripciones." },
        { title: "Obtenga Sus Formularios", desc: "Reciba su paquete completo listo para notarización y presentación." },
        { title: "Haga Preguntas", desc: "Use DivorceGPT para entender cualquier parte del proceso." }
      ]
    },
    eligibilitySection: {
      title: "¿Es Esto Para Usted?",
      subtitle: "Este servicio es para divorcios no disputados en Nevada con:",
      items: [
        "Presentación en el Condado de Clark o Washoe",
        "Sin hijos menores y ninguna parte embarazada",
        "Sin propiedad comunitaria o deudas sin dividir",
        "Sin manutención conyugal solicitada",
        "Ambos cónyuges están de acuerdo con el divorcio",
        "Al menos un cónyuge: 6 semanas en NV",
        "Testigo residente de NV disponible",
        "Ningún cónyuge en servicio militar activo"
      ],
      cta: "Verifique Su Elegibilidad"
    },
    faq: {
      title: "Preguntas Frecuentes",
      items: [
        { q: "¿Es esto asesoramiento legal?", a: "No. DivorceGPT explica qué piden los formularios de divorcio y cómo presentarlos. No proporciona asesoramiento legal." },
        { q: "¿Qué tecnología utiliza DivorceGPT?", a: "DivorceGPT usa la inteligencia artificial Claude de Anthropic a través de su API comercial. Según los términos de la API de Anthropic, sus datos no se usan para entrenar modelos de IA y se eliminan automáticamente en días. June Guided Solutions, LLC (la empresa detrás de DivorceGPT) no retiene ningún historial de chat ni datos de conversación. Si necesita soporte, debe proporcionar su propia captura de pantalla de la conversación — no tenemos forma de recuperarla." },
        { q: "¿Cuánto tarda el proceso?", a: "Condado de Clark: típicamente 1-4 semanas. Condado de Washoe: el juez tiene hasta 60 días. No hay período de espera obligatorio en Nevada." },
        { q: "¿Cómo accedo a mi sesión?", a: "Después del pago, será redirigido a su página de sesión. Guarde esta página como favorito — la URL es su enlace de acceso." },
        { q: "¿Qué pasa si mi cónyuge no coopera?", a: "Este servicio es para divorcios no disputados donde ambos cónyuges están de acuerdo. Si su cónyuge no coopera, puede necesitar un abogado." },
        { q: "¿Puedo obtener un reembolso?", a: "Si no califica después de la verificación de elegibilidad, no se le cobrará. Una vez generados los formularios, no hay reembolsos disponibles." }
      ]
    },
    qualify: {
      title: "Verifique Su Elegibilidad",
      subtitle: "Responda estas preguntas para confirmar que este servicio es adecuado para su situación.",
      successTitle: "¡Usted Califica!",
      successMsg: "Según sus respuestas, es elegible para nuestro servicio de divorcio no disputado en Nevada.",
      failTitle: "No Elegible",
      failMsg: "Según sus respuestas, este servicio puede no ser adecuado para su situación.",
      reasons: "Razones:",
      consult: "Puede necesitar consultar con un abogado de derecho familiar para su situación específica.",
      yes: "Sí",
      no: "No",
      submit: "Verificar Elegibilidad",
      continue: "Continuar al Pago",
      back: "Volver al Inicio",
      questions: {
        county: { q: "¿Está presentando en el Condado de Clark (Las Vegas) o el Condado de Washoe (Reno)?", d: "DivorceGPT actualmente sirve solo los condados de Clark y Washoe." },
        residency: { q: "¿Ha vivido al menos un cónyuge en Nevada durante al menos 6 semanas?", d: "Nevada requiere que al menos un cónyuge haya sido residente de buena fe durante 6 semanas antes de la presentación (NRS 125.020)." },
        witness: { q: "¿Tiene un residente de Nevada que pueda servir como testigo?", d: "Necesita un residente de Nevada (no un cónyuge) que pueda atestiguar la residencia del cónyuge que presenta." },
        children: { q: "¿Tienen hijos menores de 18 años, o alguna de las partes está embarazada?", d: "DivorceGPT solo maneja divorcios sin hijos menores y donde ningún cónyuge está embarazada." },
        property: { q: "¿Tienen propiedad comunitaria o deudas que aún necesitan dividirse?", d: "Si toda la propiedad y deuda ya se han dividido por acuerdo, o si no hay ninguna, aún puede calificar." },
        support: { q: "¿Algún cónyuge busca manutención conyugal (pensión alimenticia)?", d: "DivorceGPT solo maneja casos donde ninguna parte solicita pensión alimenticia." },
        uncontested: { q: "¿Ambos cónyuges están de acuerdo con el divorcio y cooperarán con la firma de los documentos requeridos?", d: "Ambos cónyuges deben estar de acuerdo y dispuestos a firmar la Petición Conjunta y el Decreto ante un notario." },
        military: { q: "¿Algún cónyuge está actualmente en servicio militar activo?", d: "Los miembros militares en servicio activo tienen protecciones legales adicionales (SCRA) que requieren representación de un abogado." },
        domesticViolence: { q: "¿Hay algún historial de violencia doméstica entre los cónyuges?", d: "Esto incluye cualquier orden de protección (activa o expirada), quejas de VD o intervención policial por incidentes domésticos." }
      },
      militaryDisqualification: "DivorceGPT no puede preparar documentos para casos donde un cónyuge está en servicio militar activo.\n\nLos miembros del servicio activo tienen protecciones legales especiales bajo la Ley de Alivio Civil para Miembros del Servicio (SCRA).\n\nRecomendamos consultar con un abogado de derecho familiar que maneje casos de divorcio militar.",
      dvDisqualification: "DivorceGPT no puede preparar documentos para casos que involucren historial de violencia doméstica entre las partes.\n\nRecomendamos consultar con un abogado de derecho familiar con experiencia en asuntos de violencia doméstica. Si está en peligro, contacte la Línea Nacional de Violencia Doméstica al 1-800-799-7233.",
      disclosure: {
        title: "Qué Hace DivorceGPT",
        description: "DivorceGPT es un servicio de preparación de documentos para divorcios de Petición Conjunta en Nevada.",
        serviceTitle: "El servicio:",
        services: [
          "Transfiere sus respuestas a los formularios requeridos",
          "Muestra etiquetas en lenguaje sencillo que identifican qué información solicita cada campo",
          "Genera un paquete PDF para su revisión antes de la presentación"
        ],
        disclaimer: "DivorceGPT no revisa sus respuestas para suficiencia legal, no proporciona asesoramiento legal ni lo representa en el tribunal.",
        freeFormsTitle: "Formularios Gratuitos Disponibles",
        freeFormsDesc: "Los formularios oficiales de divorcio están disponibles en el Centro de Autoayuda de Nevada (selfhelp.nvcourts.gov).",
        continueButton: "Continuar con DivorceGPT ($29)"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Asistente de Formularios",
      welcome: "Bienvenido a DivorceGPT",
      intro: "Puedo ayudarle a explicar sus formularios de divorcio de Nevada, qué piden y cómo presentarlos.",
      placeholder: "Pregunte sobre sus formularios de divorcio...",
      disclaimer: "DivorceGPT explica formularios y procedimientos y puede contener errores. Esto no es asesoramiento legal.",
      suggestions: [
        "¿Qué es la Petición Conjunta?",
        "¿Cómo presento en el Condado de Clark?",
        "¿Qué es la Declaración Jurada del Testigo Residente?",
        "¿Mis formularios necesitan ser notarizados?"
      ]
    },
    forms: {
      hidePanel: "Ocultar Panel",
      showPanel: "Mostrar Panel",
      sessionActive: "Sesión activa",
      complete: "Completo",
      phase: "Fase",
      commence: "Presentación",
      submit: "Enviar",
      finalize: "Finalizar",
      forms: "FORMULARIOS",
      divorceWorkflow: "PROCESO DE DIVORCIO",
      needHelp: "¿Necesita ayuda?",
      askInChat: "¡Pregunte en el chat!",
      allDone: "¡Todo listo!",
      askQuestions: "Haga preguntas sobre presentación, procedimientos o formularios.",
      downloadUD1: "Descargar Paquete de Presentación",
      downloadPackage: "Descargar Paquete",
      downloadFinalForms: "Descargar Formularios Finales",
      generating: "Generando...",
      startOver: "Comenzar de nuevo",
      hidePanelContinue: "Ocultar Panel y Continuar",
      typeAnswer: "Escriba su respuesta...",
      askAnything: "Pregunte lo que sea sobre sus formularios..."
    },
    legal: {
      privacyTitle: "Política de Privacidad",
      termsTitle: "Términos de Servicio",
      lastUpdated: "Última actualización: 11 de marzo de 2026",
      backHome: "Volver al Inicio",
      officialNotice: "AVISO OFICIAL: Los términos legalmente vinculantes a continuación se presentan en inglés para garantizar la precisión con la ley del Estado de Nevada.",
      sections: {
        agreement: "Acuerdo de Términos",
        advice: "Importante: No Es Asesoramiento Legal",
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
      title: "内华达州无争议离婚",
      subtitle: "简单办理",
      description: "用简单的语言准备和解释您的离婚表格。简单、无争议的案件不需要律师。",
      cta: "检查您是否符合资格",
      fee: "一次性费用 $29 • 无隐藏费用"
    },
    howToUse: {
      title: "如何使用",
      subtitle: "快速提示，助您充分利用 DivorceGPT",
      cards: [
        { title: "创建您的表格", desc: "回答问题。DivorceGPT 逐步为您准备文件。" },
        { title: "参考您的表格", desc: "告诉 DivorceGPT 您要询问哪个表格——联合请愿书、判决书、证人宣誓书等。" },
        { title: "用您的语言提问", desc: "用您最舒适的语言提问。我们支持西班牙语、中文、韩语和他加禄语。" },
        { title: "询问申请流程", desc: "不确定如何处理您的表格？询问申请流程、法院地址、费用或下一步。" }
      ]
    },
    howItWorks: {
      title: "如何运作",
      subtitle: "一个阶段。回答问题，提交文件，完成。",
      steps: [
        { title: "检查资格", desc: "回答几个问题以确认此服务适合您。" },
        { title: "支付 $29", desc: "一次性付款。无隐藏费用。无订阅。" },
        { title: "获取表格", desc: "收到完整的申请包，准备好公证和提交。" },
        { title: "提问", desc: "使用 DivorceGPT 了解流程的任何部分。" }
      ]
    },
    eligibilitySection: {
      title: "这适合您吗？",
      subtitle: "此服务适用于内华达州无争议离婚，条件如下：",
      items: [
        "在克拉克县或沃肖县提交",
        "无未成年子女且任何一方均未怀孕",
        "无未分割的共同财产或债务",
        "未要求配偶赡养费",
        "双方同意离婚",
        "至少一方配偶在内华达州居住6周",
        "有内华达州居民证人",
        "双方均非现役军人"
      ],
      cta: "检查您的资格"
    },
    faq: {
      title: "常见问题",
      items: [
        { q: "这是法律建议吗？", a: "不是。DivorceGPT 解释离婚表格的要求和提交方式。不提供法律建议。" },
        { q: "DivorceGPT 使用什么技术？", a: "DivorceGPT 通过商业 API 使用 Anthropic 的 Claude AI。根据 Anthropic 的 API 条款，您的输入不会用于 AI 模型训练，并会在数天内自动删除。June Guided Solutions, LLC（DivorceGPT 的运营公司）不会保留任何聊天记录或对话数据。如需支持，您必须提供自己的对话截图——我们无法检索对话内容。" },
        { q: "整个过程需要多长时间？", a: "克拉克县：通常1-4周。沃肖县：法官有60天审查。内华达州没有强制等待期。" },
        { q: "如何访问我的会话？", a: "付款后，您将被重定向到会话页面。收藏此页面——URL就是您的访问链接。" },
        { q: "如果配偶不合作怎么办？", a: "此服务适用于双方同意的无争议离婚。如果配偶不合作，您可能需要律师。" },
        { q: "可以退款吗？", a: "如果资格检查后不符合条件，不会收费。表格生成后不提供退款。" }
      ]
    },
    qualify: {
      title: "检查您的资格",
      subtitle: "回答这些问题以确认此服务适合您的情况。",
      successTitle: "您符合资格！",
      successMsg: "根据您的回答，您有资格使用我们的内华达州无争议离婚服务。",
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
        county: { q: "您是在克拉克县（拉斯维加斯）还是沃肖县（里诺）提交？", d: "DivorceGPT 目前仅服务克拉克和沃肖县。" },
        residency: { q: "至少一方配偶在内华达州居住至少6周了吗？", d: "内华达州要求至少一方配偶在提交前已成为6周的合法居民（NRS 125.020）。" },
        witness: { q: "您有内华达州居民可以担任证人吗？", d: "您需要一位内华达州居民（非配偶）来证明提交方配偶的居住情况。" },
        children: { q: "您有未成年子女（18岁以下），或任何一方目前怀孕了吗？", d: "DivorceGPT 仅处理无未成年子女且双方均未怀孕的离婚案件。" },
        property: { q: "您是否有共同财产或债务尚未分割？", d: "如果所有财产和债务已通过协议分割，或没有任何财产债务，您仍可能符合资格。" },
        support: { q: "任何一方是否寻求配偶赡养费？", d: "DivorceGPT 仅处理双方均不要求赡养费的案件。" },
        uncontested: { q: "双方是否同意离婚并愿意配合签署所需文件？", d: "双方必须同意并愿意在公证人面前签署联合请愿书和判决书。" },
        military: { q: "任何一方配偶目前是否在现役军事服务中？", d: "现役军人享有额外的法律保护（SCRA），需要律师代理。" },
        domesticViolence: { q: "配偶之间是否有任何家庭暴力历史？", d: "包括任何保护令（有效或已过期）、家暴投诉或因家庭事件的警方介入。" }
      },
      militaryDisqualification: "DivorceGPT 无法为涉及现役军人的案件准备文件。\n\n建议咨询处理军事离婚案件的家庭法律师。",
      dvDisqualification: "DivorceGPT 无法为涉及家庭暴力历史的案件准备文件。\n\n建议咨询有家庭暴力经验的家庭法律师。如果您处于危险中，请拨打全国家庭暴力热线 1-800-799-7233。",
      disclosure: {
        title: "DivorceGPT 的功能",
        description: "DivorceGPT 是内华达州联合请愿离婚的文件准备服务。",
        serviceTitle: "服务内容：",
        services: [
          "将您的回答填入所需表格",
          "显示简明标签说明每个表格字段需要什么信息",
          "生成PDF文件包供您在提交前审查"
        ],
        disclaimer: "DivorceGPT 不审查您的回答是否符合法律要求，不提供法律建议，也不在法庭上代表您。",
        freeFormsTitle: "免费表格可用",
        freeFormsDesc: "官方离婚表格可从内华达州自助中心（selfhelp.nvcourts.gov）获取。",
        continueButton: "继续使用 DivorceGPT ($29)"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "表格助手",
      welcome: "欢迎使用 DivorceGPT",
      intro: "我可以帮助您解释内华达州离婚表格的内容和提交方式。",
      placeholder: "询问您的离婚表格...",
      disclaimer: "DivorceGPT 解释表格和程序，可能包含错误。这不是法律建议。",
      suggestions: [
        "什么是联合请愿书？",
        "如何在克拉克县提交？",
        "什么是居民证人宣誓书？",
        "我的表格需要公证吗？"
      ]
    },
    forms: {
      hidePanel: "隐藏面板",
      showPanel: "显示面板",
      sessionActive: "会话活跃",
      complete: "完成",
      phase: "阶段",
      commence: "申请",
      submit: "提交",
      finalize: "完成",
      forms: "表格",
      divorceWorkflow: "离婚流程",
      needHelp: "需要帮助？",
      askInChat: "在聊天中提问！",
      allDone: "全部完成！",
      askQuestions: "询问有关申请、程序或表格的问题。",
      downloadUD1: "下载申请包",
      downloadPackage: "下载文件包",
      downloadFinalForms: "下载最终表格",
      generating: "生成中...",
      startOver: "重新开始",
      hidePanelContinue: "隐藏面板并继续聊天",
      typeAnswer: "输入您的回答...",
      askAnything: "随时问我有关表格的任何问题..."
    },
    legal: {
      privacyTitle: "隐私政策",
      termsTitle: "服务条款",
      lastUpdated: "最后更新：2026年3月11日",
      backHome: "返回首页",
      officialNotice: "官方通知：以下具有法律约束力的条款以英文呈现，以确保与内华达州法律的准确性。",
      sections: {
        agreement: "条款协议",
        advice: "重要提示：非法律建议",
        service: "服务描述",
        eligibility: "资格要求",
        ai: "AI 生成内容",
        payment: "付款和退款",
        liability: "责任限制",
        contact: "联系我们"
      }
    }
  },

  ko: {
    hero: {
      title: "네바다주 무쟁의 이혼",
      subtitle: "간편하게",
      description: "이혼 서류를 쉬운 언어로 준비하고 설명해 드립니다. 간단한 무쟁의 사건에는 변호사가 필요하지 않습니다.",
      cta: "자격 확인하기",
      fee: "일회성 수수료 $29 • 숨겨진 비용 없음"
    },
    howToUse: {
      title: "사용 방법",
      subtitle: "DivorceGPT를 최대한 활용하기 위한 빠른 팁",
      cards: [
        { title: "서류 작성하기", desc: "질문에 답하세요. DivorceGPT가 단계별로 문서를 준비합니다." },
        { title: "서류 참조하기", desc: "DivorceGPT에게 어떤 서류에 대해 묻는지 알려주세요 — 공동 청원서, 판결문, 선서 진술서 등." },
        { title: "모국어로 질문하기", desc: "편한 언어로 질문하세요. 스페인어, 중국어, 한국어, 타갈로그어를 지원합니다." },
        { title: "접수 과정 문의", desc: "서류를 어떻게 해야 할지 모르시겠나요? 접수 과정, 법원 위치, 수수료 또는 다음 단계에 대해 문의하세요." }
      ]
    },
    howItWorks: {
      title: "진행 방법",
      subtitle: "한 단계. 질문에 답하고, 서류를 제출하면 완료.",
      steps: [
        { title: "자격 확인", desc: "몇 가지 질문에 답하여 이 서비스가 적합한지 확인하세요." },
        { title: "$29 결제", desc: "일회성 결제. 숨겨진 수수료 없음. 구독 없음." },
        { title: "서류 받기", desc: "공증 및 제출 준비가 완료된 서류 패키지를 받으세요." },
        { title: "질문하기", desc: "DivorceGPT를 사용하여 과정의 어떤 부분이든 이해하세요." }
      ]
    },
    eligibilitySection: {
      title: "이 서비스가 적합한가요?",
      subtitle: "이 서비스는 다음 조건의 네바다주 무쟁의 이혼을 위한 것입니다:",
      items: [
        "클라크 카운티 또는 와쇼 카운티에서 접수",
        "미성년 자녀 없음 및 임신 중이지 않음",
        "분할되지 않은 공동 재산 또는 부채 없음",
        "배우자 부양료 요청 없음",
        "양 배우자 이혼에 동의",
        "최소 한 배우자: NV 6주 거주",
        "NV 거주 증인 가능",
        "양 배우자 현역 군인 아님"
      ],
      cta: "자격 확인하기"
    },
    faq: {
      title: "자주 묻는 질문",
      items: [
        { q: "법률 자문인가요?", a: "아닙니다. DivorceGPT는 이혼 서류가 요구하는 내용과 제출 방법을 설명합니다. 법률 자문을 제공하지 않습니다." },
        { q: "DivorceGPT는 어떤 기술을 사용하나요?", a: "DivorceGPT는 Anthropic의 Claude AI를 상용 API를 통해 사용합니다. Anthropic의 API 약관에 따라 귀하의 입력은 AI 모델 학습에 사용되지 않으며 며칠 내에 자동 삭제됩니다. June Guided Solutions, LLC(DivorceGPT 운영 회사)는 채팅 기록이나 대화 데이터를 일절 보관하지 않습니다. 지원이 필요한 경우 대화 스크린샷을 직접 제공해야 합니다 — 저희는 대화를 복구할 수 없습니다." },
        { q: "과정은 얼마나 걸리나요?", a: "클라크 카운티: 보통 1-4주. 와쇼 카운티: 판사가 최대 60일. 네바다주에는 의무 대기 기간이 없습니다." },
        { q: "세션에 어떻게 접속하나요?", a: "결제 후 세션 페이지로 리디렉션됩니다. 이 페이지를 북마크하세요 — URL이 접속 링크입니다." },
        { q: "배우자가 협조하지 않으면?", a: "이 서비스는 양 배우자가 동의하는 무쟁의 이혼을 위한 것입니다. 배우자가 협조하지 않으면 변호사가 필요할 수 있습니다." },
        { q: "환불 받을 수 있나요?", a: "자격 확인 후 자격이 안 되면 청구되지 않습니다. 서류가 생성되면 환불이 불가합니다." }
      ]
    },
    qualify: {
      title: "자격 확인",
      subtitle: "이 서비스가 귀하의 상황에 적합한지 확인하려면 이 질문에 답하세요.",
      successTitle: "자격이 됩니다!",
      successMsg: "귀하의 답변에 따르면 네바다주 무쟁의 이혼 서비스를 이용할 자격이 있습니다.",
      failTitle: "자격 미달",
      failMsg: "귀하의 답변에 따르면 이 서비스가 적합하지 않을 수 있습니다.",
      reasons: "이유:",
      consult: "귀하의 특정 상황에 대해 가정법 변호사와 상담이 필요할 수 있습니다.",
      yes: "예",
      no: "아니오",
      submit: "자격 확인",
      continue: "결제 진행",
      back: "홈으로 돌아가기",
      questions: {
        county: { q: "클라크 카운티(라스베이거스)에서 접수하시나요, 와쇼 카운티(리노)에서 접수하시나요?", d: "DivorceGPT는 현재 클라크와 와쇼 카운티만 서비스합니다." },
        residency: { q: "최소 한 배우자가 네바다주에 6주 이상 거주했나요?", d: "네바다주는 접수 전 최소 한 배우자가 6주간 거주해야 합니다 (NRS 125.020)." },
        witness: { q: "증인 역할을 할 수 있는 네바다주 거주자가 있나요?", d: "접수하는 배우자의 거주를 증명할 수 있는 네바다주 거주자(배우자 아님)가 필요합니다." },
        children: { q: "미성년 자녀(18세 미만)가 있거나 현재 임신 중인가요?", d: "DivorceGPT는 미성년 자녀가 없고 양 배우자 모두 임신하지 않은 이혼만 처리합니다." },
        property: { q: "아직 분할되지 않은 공동 재산이나 부채가 있나요?", d: "모든 재산과 부채가 합의로 분할되었거나 없는 경우 자격이 될 수 있습니다." },
        support: { q: "어느 배우자가 배우자 부양료를 요청하고 있나요?", d: "DivorceGPT는 어느 쪽도 부양료를 요청하지 않는 경우만 처리합니다." },
        uncontested: { q: "양 배우자가 이혼에 동의하고 필요한 서류 서명에 협조하나요?", d: "양 배우자가 동의하고 공증인 앞에서 공동 청원서와 판결문에 서명해야 합니다." },
        military: { q: "어느 배우자가 현재 현역 군 복무 중인가요?", d: "현역 군인은 추가 법적 보호(SCRA)가 있어 변호사 대리가 필요합니다." },
        domesticViolence: { q: "배우자 사이에 가정폭력 이력이 있나요?", d: "보호 명령(유효 또는 만료), 가정폭력 신고 또는 가정 사건 관련 경찰 개입을 포함합니다." }
      },
      militaryDisqualification: "DivorceGPT는 배우자가 현역 군 복무 중인 경우 서류를 준비할 수 없습니다.\n\n군사 이혼 사건을 다루는 가정법 변호사와 상담하시기 바랍니다.",
      dvDisqualification: "DivorceGPT는 가정폭력 이력이 있는 경우 서류를 준비할 수 없습니다.\n\n가정폭력 경험이 있는 가정법 변호사와 상담하시기 바랍니다. 위험에 처해 있다면 전국 가정폭력 핫라인 1-800-799-7233으로 연락하세요.",
      disclosure: {
        title: "DivorceGPT의 기능",
        description: "DivorceGPT는 네바다주 공동 청원 이혼을 위한 서류 준비 서비스입니다.",
        serviceTitle: "서비스 내용:",
        services: [
          "귀하의 답변을 필요한 양식에 입력합니다",
          "각 양식 필드가 요청하는 정보를 설명하는 쉬운 라벨을 표시합니다",
          "제출 전 검토할 수 있는 PDF 패키지를 생성합니다"
        ],
        disclaimer: "DivorceGPT는 귀하의 답변이 법적으로 충분한지 검토하지 않으며, 법률 자문을 제공하지 않으며, 법정에서 대리하지 않습니다.",
        freeFormsTitle: "무료 양식 이용 가능",
        freeFormsDesc: "공식 이혼 양식은 네바다주 자조 센터(selfhelp.nvcourts.gov)에서 받을 수 있습니다.",
        continueButton: "DivorceGPT로 계속 ($29)"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "서류 도우미",
      welcome: "DivorceGPT에 오신 것을 환영합니다",
      intro: "네바다주 이혼 서류의 내용과 제출 방법을 설명해 드릴 수 있습니다.",
      placeholder: "이혼 서류에 대해 질문하세요...",
      disclaimer: "DivorceGPT는 서류와 절차를 설명하며 오류가 있을 수 있습니다. 이것은 법률 자문이 아닙니다.",
      suggestions: [
        "공동 청원서란 무엇인가요?",
        "클라크 카운티에서 어떻게 접수하나요?",
        "거주 증인 선서 진술서란 무엇인가요?",
        "서류에 공증이 필요한가요?"
      ]
    },
    forms: {
      hidePanel: "패널 숨기기",
      showPanel: "패널 보기",
      sessionActive: "세션 활성",
      complete: "완료",
      phase: "단계",
      commence: "접수",
      submit: "제출",
      finalize: "완료",
      forms: "서류",
      divorceWorkflow: "이혼 절차",
      needHelp: "도움이 필요하세요?",
      askInChat: "채팅에서 물어보세요!",
      allDone: "모두 완료!",
      askQuestions: "접수, 절차 또는 서류에 대해 질문하세요.",
      downloadUD1: "접수 패키지 다운로드",
      downloadPackage: "패키지 다운로드",
      downloadFinalForms: "최종 서류 다운로드",
      generating: "생성 중...",
      startOver: "처음부터 다시",
      hidePanelContinue: "패널 숨기고 채팅 계속",
      typeAnswer: "답변을 입력하세요...",
      askAnything: "서류에 대해 무엇이든 물어보세요..."
    },
    legal: {
      privacyTitle: "개인정보 보호정책",
      termsTitle: "서비스 약관",
      lastUpdated: "최종 업데이트: 2026년 3월 11일",
      backHome: "홈으로 돌아가기",
      officialNotice: "공식 안내: 아래의 법적 구속력이 있는 조건은 네바다주 법률과의 정확성을 보장하기 위해 영어로 제공됩니다.",
      sections: {
        agreement: "약관 동의",
        advice: "중요: 법률 자문이 아님",
        service: "서비스 설명",
        eligibility: "자격 요건",
        ai: "AI 생성 콘텐츠",
        payment: "결제 및 환불",
        liability: "책임 제한",
        contact: "문의하기"
      }
    }
  },

  // Tagalog — mapped to 'ht' slot in Locale type for NV only
  ht: {
    hero: {
      title: "Nevada Uncontested Divorce",
      subtitle: "Pinasimple",
      description: "Ihanda ang iyong mga form ng diborsyo na ipinaliwanag sa simpleng wika. Hindi kailangan ng abogado para sa simple, uncontested na mga kaso.",
      cta: "Tingnan Kung Kwalipikado Ka",
      fee: "Isang beses na bayad na $29 • Walang nakatagong gastos"
    },
    howToUse: {
      title: "Paano Gamitin",
      subtitle: "Mabilis na tips para masulit ang DivorceGPT",
      cards: [
        { title: "Gumawa ng Iyong Forms", desc: "Sagutin ang mga tanong. Ihahanda ng DivorceGPT ang iyong mga dokumento hakbang-hakbang." },
        { title: "Sanggunian ang Iyong Forms", desc: "Sabihin sa DivorceGPT kung aling form ang tinatanong mo — Joint Petition, Decree, Affidavit, atbp." },
        { title: "Magtanong sa Iyong Wika", desc: "Magtanong sa wikang komportable ka. Sumusuporta kami ng Espanyol, Tsino, Korean, at Tagalog." },
        { title: "Magtanong Tungkol sa Pag-file", desc: "Hindi sigurado kung ano ang gagawin sa iyong mga form? Magtanong tungkol sa proseso ng pag-file, lokasyon ng korte, bayarin, o susunod na hakbang." }
      ]
    },
    howItWorks: {
      title: "Paano Ito Gumagana",
      subtitle: "Isang phase. Sagutin ang mga tanong, i-file ang mga dokumento, tapos na.",
      steps: [
        { title: "Suriin ang Kwalipikasyon", desc: "Sagutin ang ilang tanong para kumpirmahin na tama ang serbisyong ito para sa iyo." },
        { title: "Magbayad ng $29", desc: "Isang beses na bayad. Walang nakatagong bayarin. Walang subscription." },
        { title: "Kunin ang Iyong Forms", desc: "Matanggap ang iyong kumpletong filing packet na handa para sa notarization at pag-file." },
        { title: "Magtanong", desc: "Gamitin ang DivorceGPT para maunawaan ang anumang bahagi ng proseso." }
      ]
    },
    eligibilitySection: {
      title: "Tama Ba Ito Para Sa Iyo?",
      subtitle: "Ang serbisyong ito ay para sa Nevada uncontested divorces na may:",
      items: [
        "Nag-file sa Clark County o Washoe County",
        "Walang menor de edad na anak at walang buntis",
        "Walang hindi pa nahahatiang community property o utang",
        "Walang hinihinging spousal support",
        "Parehong mag-asawa ay sumasang-ayon sa diborsyo",
        "Hindi bababa sa isang asawa: 6 na linggo sa NV",
        "May available na NV resident witness",
        "Walang asawa na active military"
      ],
      cta: "Suriin ang Iyong Kwalipikasyon"
    },
    faq: {
      title: "Mga Madalas Itanong",
      items: [
        { q: "Legal advice ba ito?", a: "Hindi. Ipinapaliwanag ng DivorceGPT kung ano ang hinihingi ng divorce forms at paano i-file. Hindi nagbibigay ng legal advice." },
        { q: "Anong teknolohiya ang ginagamit ng DivorceGPT?", a: "Gumagamit ang DivorceGPT ng Claude AI ng Anthropic sa pamamagitan ng kanilang commercial API. Ayon sa mga tuntunin ng API ng Anthropic, ang iyong mga input ay hindi ginagamit para sa AI model training at awtomatikong dine-delete sa loob ng ilang araw. Ang June Guided Solutions, LLC (ang kumpanya sa likod ng DivorceGPT) ay hindi nagtatago ng anumang chat history o data ng usapan. Kung kailangan mo ng suporta, kailangan mong magbigay ng sarili mong screenshot ng usapan — wala kaming paraan para makuha ito." },
        { q: "Gaano katagal ang proseso?", a: "Clark County: karaniwang 1-4 na linggo. Washoe County: ang hukom ay may hanggang 60 araw. Walang mandatory waiting period sa Nevada." },
        { q: "Paano ko ma-access ang aking session?", a: "Pagkatapos magbayad, ma-redirect ka sa iyong session page. I-bookmark ang page — ang URL ang iyong access link." },
        { q: "Paano kung ayaw makipagtulungan ng asawa ko?", a: "Ang serbisyong ito ay para sa uncontested divorces kung saan parehong sumasang-ayon ang mag-asawa. Kung ayaw makipagtulungan ng asawa mo, maaaring kailangan mo ng abogado." },
        { q: "Maaari ba akong mag-refund?", a: "Kung hindi ka kwalipikado pagkatapos ng eligibility check, hindi ka sisingilin. Kapag na-generate na ang mga form, walang refund." }
      ]
    },
    qualify: {
      title: "Suriin ang Iyong Kwalipikasyon",
      subtitle: "Sagutin ang mga tanong na ito para kumpirmahin na tama ang serbisyong ito para sa iyong sitwasyon.",
      successTitle: "Kwalipikado Ka!",
      successMsg: "Batay sa iyong mga sagot, kwalipikado ka para sa aming Nevada uncontested divorce service.",
      failTitle: "Hindi Kwalipikado",
      failMsg: "Batay sa iyong mga sagot, maaaring hindi tama ang serbisyong ito para sa iyong sitwasyon.",
      reasons: "Mga Dahilan:",
      consult: "Maaaring kailangan mong kumonsulta sa isang family law attorney para sa iyong partikular na sitwasyon.",
      yes: "Oo",
      no: "Hindi",
      submit: "Suriin ang Kwalipikasyon",
      continue: "Magpatuloy sa Pagbayad",
      back: "Bumalik sa Home",
      questions: {
        county: { q: "Nag-file ka ba sa Clark County (Las Vegas) o Washoe County (Reno)?", d: "Kasalukuyang naglilingkod lang ang DivorceGPT sa Clark at Washoe counties." },
        residency: { q: "May hindi bababa sa isang asawa na nakatira sa Nevada ng hindi bababa sa 6 na linggo?", d: "Kinakailangan ng Nevada na hindi bababa sa isang asawa ang naging bona fide resident ng 6 na linggo bago mag-file (NRS 125.020)." },
        witness: { q: "May Nevada resident ka bang maaaring maging witness?", d: "Kailangan mo ng third-party Nevada resident (hindi asawa) na makakapagpatunay ng residency ng nag-file na asawa." },
        children: { q: "Mayroon ba kayong menor de edad na anak (wala pang 18), o buntis ba ang alinmang partido?", d: "Ang DivorceGPT ay humahawak lamang ng mga diborsyo na walang menor de edad na anak at walang buntis na asawa." },
        property: { q: "Mayroon ba kayong community property o utang na kailangan pang hatiin?", d: "Kung nahati na ang lahat ng property at utang sa pamamagitan ng kasunduan, o kung wala, maaari ka pa ring kwalipikado." },
        support: { q: "May humihingi ba ng spousal support (alimony) sa alinmang asawa?", d: "Humahawak lamang ang DivorceGPT ng mga kaso kung saan walang partido ang humihingi ng alimony." },
        uncontested: { q: "Parehong sumasang-ayon ba ang mag-asawa sa diborsyo at makikipagtulungan sa pagpirma ng mga kinakailangang dokumento?", d: "Dapat sumang-ayon ang parehong asawa at handang pumirma sa Joint Petition at Decree sa harap ng notary." },
        military: { q: "May asawa bang kasalukuyang nasa active military duty?", d: "Ang mga active duty military members ay may karagdagang legal protections (SCRA) na nangangailangan ng attorney representation." },
        domesticViolence: { q: "May anumang kasaysayan ba ng domestic violence sa pagitan ng mag-asawa?", d: "Kasama dito ang anumang protective orders (active o expired), DV complaints, o police involvement para sa domestic incidents." }
      },
      militaryDisqualification: "Hindi makapaghanda ang DivorceGPT ng mga dokumento para sa mga kaso kung saan ang isang asawa ay nasa active military service.\n\nInirerekomenda naming kumonsulta sa isang family law attorney na humahawak ng military divorce cases.",
      dvDisqualification: "Hindi makapaghanda ang DivorceGPT ng mga dokumento para sa mga kaso na may domestic violence history.\n\nInirerekomenda naming kumonsulta sa isang family law attorney na may karanasan sa domestic violence. Kung ikaw ay nasa panganib, kontakin ang National Domestic Violence Hotline sa 1-800-799-7233.",
      disclosure: {
        title: "Ano ang Ginagawa ng DivorceGPT",
        description: "Ang DivorceGPT ay isang document preparation service para sa Nevada Joint Petition divorces.",
        serviceTitle: "Ang serbisyo:",
        services: [
          "Inililipat ang iyong mga sagot sa mga kinakailangang form",
          "Nagpapakita ng mga plain-language label na nagpapaliwanag kung anong impormasyon ang hinihingi ng bawat field",
          "Gumagawa ng PDF packet para sa iyong pagsusuri bago mag-file"
        ],
        disclaimer: "Hindi sinusuri ng DivorceGPT ang iyong mga sagot para sa legal sufficiency, hindi nagbibigay ng legal advice, o kumakatawan sa iyo sa korte.",
        freeFormsTitle: "Libreng Forms Available",
        freeFormsDesc: "Ang mga opisyal na divorce forms ay available mula sa Nevada Self-Help Center (selfhelp.nvcourts.gov).",
        continueButton: "Magpatuloy sa DivorceGPT ($29)"
      }
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Form Assistant",
      welcome: "Maligayang pagdating sa DivorceGPT",
      intro: "Makakatulong ako na ipaliwanag ang iyong Nevada divorce forms, kung ano ang hinihingi nila, at paano i-file.",
      placeholder: "Magtanong tungkol sa iyong divorce forms...",
      disclaimer: "Nagpapaliwanag ang DivorceGPT ng forms at procedures at maaaring may mga pagkakamali. Hindi ito legal advice.",
      suggestions: [
        "Ano ang Joint Petition?",
        "Paano mag-file sa Clark County?",
        "Ano ang Affidavit of Resident Witness?",
        "Kailangan bang i-notarize ang aking mga form?"
      ]
    },
    forms: {
      hidePanel: "Itago ang Panel",
      showPanel: "Ipakita ang Panel",
      sessionActive: "Session aktibo",
      complete: "Kumpleto",
      phase: "Phase",
      commence: "Filing",
      submit: "I-submit",
      finalize: "I-finalize",
      forms: "MGA FORM",
      divorceWorkflow: "PROSESO NG DIBORSYO",
      needHelp: "Kailangan ng tulong?",
      askInChat: "Magtanong sa chat!",
      allDone: "Tapos na lahat!",
      askQuestions: "Magtanong tungkol sa pag-file, procedures, o forms.",
      downloadUD1: "I-download ang Filing Packet",
      downloadPackage: "I-download ang Package",
      downloadFinalForms: "I-download ang Final Forms",
      generating: "Ginagawa...",
      startOver: "Magsimula muli",
      hidePanelContinue: "Itago ang Panel at Magpatuloy sa Chat",
      typeAnswer: "I-type ang iyong sagot...",
      askAnything: "Magtanong ng kahit ano tungkol sa iyong mga form..."
    },
    legal: {
      privacyTitle: "Privacy Policy",
      termsTitle: "Terms of Service",
      lastUpdated: "Huling na-update: Marso 11, 2026",
      backHome: "Bumalik sa Home",
      officialNotice: "OPISYAL NA PAUNAWA: Ang mga legal na tuntunin sa ibaba ay ipinakita sa Ingles para matiyak ang katumpakan sa batas ng Estado ng Nevada.",
      sections: {
        agreement: "Kasunduan sa mga Tuntunin",
        advice: "Mahalaga: Hindi Legal Advice",
        service: "Paglalarawan ng Serbisyo",
        eligibility: "Kwalipikasyon",
        ai: "AI-Generated Content",
        payment: "Pagbayad at Refunds",
        liability: "Limitasyon ng Pananagutan",
        contact: "Makipag-ugnayan"
      }
    }
  },

  // Russian slot unused for NV — map to English fallback
  ru: undefined
};

// Replace undefined ru with English fallback
if (!nvDictionary.ru) {
  nvDictionary.ru = nvDictionary.en;
}
