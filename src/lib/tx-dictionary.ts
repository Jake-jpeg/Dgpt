import { Locale } from './ny-dictionary';

// TX uses: en, es, vi (Vietnamese), zh, ko
// Vietnamese mapped to 'ht' slot in the Locale type (same pattern as NV Tagalog)
// This avoids changing the global Locale type.

export const txDictionary: Record<string, any> = {
  en: {
    hero: {
      title: "Texas Uncontested Divorce",
      subtitle: "Made Simple",
      description: "Get your divorce forms prepared and explained in plain language. No lawyers needed for simple, uncontested cases.",
      cta: "Check If You Qualify",
      fee: "$99 one-time fee • No hidden costs"
    },
    howItWorks: {
      title: "How It Works",
      subtitle: "Answer questions, get your forms, file with the court.",
      steps: [
        { title: "Check Eligibility", desc: "Answer a few questions to confirm this service is right for you." },
        { title: "Pay $99", desc: "One-time payment. No hidden fees. No subscriptions." },
        { title: "Get Your Forms", desc: "Receive your complete filing packet ready for filing." },
        { title: "Ask Questions", desc: "Use DivorceGPT to understand any part of the process." }
      ]
    },
    eligibilitySection: {
      title: "Is This Right For You?",
      subtitle: "This service is for Texas uncontested divorces with:",
      items: [
        "No minor children and neither party is pregnant",
        "No real property (real estate) to divide",
        "No spousal maintenance requested",
        "Both spouses agree to the divorce",
        "At least one spouse: 6 months in Texas",
        "At least one spouse: 90 days in filing county",
        "Neither spouse is active military"
      ],
      cta: "Check Your Eligibility"
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "Is this legal advice?", a: "No. DivorceGPT explains what divorce forms ask for and how to file them. It does not provide legal advice. For legal advice, consult an attorney." },
        { q: "What technology powers DivorceGPT?", a: "DivorceGPT uses advanced AI technology via a secure commercial API. Under our API provider's terms, your inputs are not used for AI model training and are automatically deleted within days. June Guided Solutions, LLC (the company behind DivorceGPT) does not retain any chat history or conversation data. If you need support, you must provide your own screenshot of the conversation — we have no way to retrieve it." },
        { q: "How long does the process take?", a: "You can complete your forms in minutes. Texas has a mandatory 60-day waiting period from the date of filing before the divorce can be finalized. Your session remains valid for 12 months." },
        { q: "How do I access my session?", a: "After payment, you'll be redirected to your session page. Bookmark this page — the URL is your access link. There are no accounts or passwords." },
        { q: "What if my spouse won't cooperate?", a: "This service is for uncontested divorces where both spouses agree. If your spouse won't cooperate, you may need a contested divorce attorney." },
        { q: "Can I get a refund?", a: "If you don't qualify after the eligibility check, you won't be charged. Once forms are generated, refunds are not available." }
      ]
    },
    qualify: {
      title: "Check Your Eligibility",
      subtitle: "Answer these questions to confirm this service is right for your situation.",
      successTitle: "You Qualify!",
      successMsg: "Based on your answers, you're eligible for our Texas uncontested divorce service.",
      failTitle: "Not Eligible",
      failMsg: "Based on your answers, this service may not be right for your situation.",
      reasons: "Reasons:",
      consult: "You may need to consult with a family law attorney for your specific situation.",
      yes: "Yes",
      no: "No",
      submit: "Check Eligibility",
      continue: "Continue to Payment",
      back: "Back to Home",
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Form Assistant",
      welcome: "Welcome to DivorceGPT",
      intro: "I can help explain your Texas divorce forms, what they ask for, and how to file them.",
      placeholder: "Ask about your divorce forms...",
      send: "Send",
      generating: "Generating documents...",
      download: "Download Filing Packet",
      sidebar: "Your Information",
      complete: "All information collected!",
    },
  },
  es: {
    hero: {
      title: "Divorcio No Contencioso en Texas",
      subtitle: "Simplificado",
      description: "Prepare sus formularios de divorcio explicados en lenguaje sencillo. No se necesitan abogados para casos simples y no contenciosos.",
      cta: "Verifique Si Califica",
      fee: "Tarifa única de $99 • Sin costos ocultos"
    },
    howItWorks: {
      title: "Cómo Funciona",
      subtitle: "Responda preguntas, obtenga sus formularios, presente ante el tribunal.",
      steps: [
        { title: "Verifique Elegibilidad", desc: "Responda algunas preguntas para confirmar que este servicio es adecuado para usted." },
        { title: "Pague $99", desc: "Pago único. Sin tarifas ocultas. Sin suscripciones." },
        { title: "Obtenga Sus Formularios", desc: "Reciba su paquete completo listo para presentar." },
        { title: "Haga Preguntas", desc: "Use DivorceGPT para entender cualquier parte del proceso." }
      ]
    },
    eligibilitySection: {
      title: "¿Es Esto Para Usted?",
      subtitle: "Este servicio es para divorcios no contenciosos en Texas con:",
      items: [
        "Sin hijos menores y ninguna parte está embarazada",
        "Sin bienes raíces que dividir",
        "Sin manutención conyugal solicitada",
        "Ambos cónyuges están de acuerdo con el divorcio",
        "Al menos un cónyuge: 6 meses en Texas",
        "Al menos un cónyuge: 90 días en el condado",
        "Ningún cónyuge es militar activo"
      ],
      cta: "Verifique Su Elegibilidad"
    },
    faq: {
      title: "Preguntas Frecuentes",
      items: [
        { q: "¿Es esto asesoría legal?", a: "No. DivorceGPT explica lo que piden los formularios de divorcio y cómo presentarlos. No proporciona asesoría legal. Para asesoría legal, consulte a un abogado." },
        { q: "¿Qué tecnología usa DivorceGPT?", a: "DivorceGPT usa tecnología avanzada de IA a través de una API comercial segura. Según los términos de nuestro proveedor de API, sus datos no se usan para entrenar modelos de IA y se eliminan automáticamente en días. June Guided Solutions, LLC (la empresa detrás de DivorceGPT) no retiene ningún historial de chat ni datos de conversación. Si necesita soporte, debe proporcionar su propia captura de pantalla de la conversación — no tenemos forma de recuperarla." },
        { q: "¿Cuánto tiempo toma el proceso?", a: "Puede completar sus formularios en minutos. Texas tiene un período de espera obligatorio de 60 días desde la fecha de presentación. Su sesión es válida por 12 meses." },
        { q: "¿Cómo accedo a mi sesión?", a: "Después del pago, será redirigido a su página de sesión. Marque esta página como favorita — la URL es su enlace de acceso. No hay cuentas ni contraseñas." },
        { q: "¿Qué pasa si mi cónyuge no coopera?", a: "Este servicio es para divorcios no contestados donde ambos cónyuges están de acuerdo. Si su cónyuge no coopera, puede necesitar un abogado de divorcio contencioso." },
        { q: "¿Puedo obtener un reembolso?", a: "Si no califica después de la verificación de elegibilidad, no se le cobrará. Una vez que se generan los formularios, no hay reembolsos disponibles." }
      ]
    },
    qualify: {
      title: "Verifique Su Elegibilidad",
      subtitle: "Responda estas preguntas para confirmar que este servicio es adecuado para su situación.",
      successTitle: "¡Usted Califica!",
      successMsg: "Según sus respuestas, es elegible para nuestro servicio de divorcio no contencioso en Texas.",
      failTitle: "No Elegible",
      failMsg: "Según sus respuestas, este servicio puede no ser adecuado para su situación.",
      yes: "Sí",
      no: "No",
      submit: "Verificar Elegibilidad",
      continue: "Continuar al Pago",
      back: "Volver al Inicio",
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Asistente de Formularios",
      welcome: "Bienvenido a DivorceGPT",
      intro: "Puedo ayudarle a entender sus formularios de divorcio de Texas, lo que piden y cómo presentarlos.",
      placeholder: "Pregunte sobre sus formularios de divorcio...",
      send: "Enviar",
      generating: "Generando documentos...",
      download: "Descargar Paquete",
      sidebar: "Su Información",
      complete: "¡Toda la información recopilada!",
    },
  },
  zh: {
    hero: {
      title: "德克萨斯州无争议离婚",
      subtitle: "简单办理",
      description: "用通俗语言准备和解释您的离婚表格。简单、无争议的案件无需律师。",
      cta: "查看是否符合条件",
      fee: "一次性费用 $99 · 无隐藏费用"
    },
    howItWorks: {
      title: "如何使用",
      subtitle: "回答问题，获取表格，向法院提交。",
      steps: [
        { title: "检查资格", desc: "回答几个问题以确认此服务适合您。" },
        { title: "支付 $99", desc: "一次性付款。无隐藏费用。无订阅。" },
        { title: "获取表格", desc: "收到您的完整申请包，准备提交。" },
        { title: "提问", desc: "使用 DivorceGPT 了解流程的任何部分。" }
      ]
    },
    eligibilitySection: {
      title: "这适合您吗？",
      subtitle: "此服务适用于德克萨斯州无争议离婚：",
      items: [
        "无未成年子女且双方均未怀孕",
        "无需分割的不动产",
        "未要求配偶赡养费",
        "双方同意离婚",
        "至少一方在德州居住6个月",
        "至少一方在申请县居住90天",
        "双方均非现役军人"
      ],
      cta: "检查您的资格"
    },
    faq: {
      title: "常见问题",
      items: [
        { q: "这是法律建议吗？", a: "不是。DivorceGPT 解释离婚表格的要求以及如何提交。不提供法律建议。如需法律建议，请咨询律师。" },
        { q: "DivorceGPT 使用什么技术？", a: "DivorceGPT 通过安全商业 API 使用先进的 AI 技术。根据我们 API 提供商的条款，您的输入不会用于 AI 模型训练，并会在数天内自动删除。June Guided Solutions, LLC（DivorceGPT 的运营公司）不会保留任何聊天记录或对话数据。如需支持，您必须提供自己的对话截图——我们无法检索对话内容。" },
        { q: "流程需要多长时间？", a: "您可以在几分钟内完成表格。德克萨斯州从提交之日起有60天的强制等待期。您的会话有效期为12个月。" },
        { q: "如何访问我的会话？", a: "付款后，您将被重定向到会话页面。请收藏此页面——URL就是您的访问链接。无需账户或密码。" },
        { q: "如果配偶不合作怎么办？", a: "此服务适用于双方同意的无争议离婚。如果配偶不合作，您可能需要聘请律师处理有争议的离婚。" },
        { q: "可以退款吗？", a: "如果资格检查后不符合条件，将不会收费。一旦生成表格，不提供退款。" }
      ]
    },
    qualify: {
      title: "检查您的资格",
      subtitle: "回答这些问题以确认此服务适合您的情况。",
      successTitle: "您符合条件！",
      successMsg: "根据您的回答，您有资格使用我们的德克萨斯州无争议离婚服务。",
      failTitle: "不符合条件",
      failMsg: "根据您的回答，此服务可能不适合您的情况。",
      yes: "是",
      no: "否",
      submit: "检查资格",
      continue: "继续付款",
      back: "返回首页",
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "表格助手",
      welcome: "欢迎使用 DivorceGPT",
      intro: "我可以帮助您了解德克萨斯州离婚表格的要求以及如何提交。",
      placeholder: "询问您的离婚表格...",
      send: "发送",
      generating: "正在生成文件...",
      download: "下载申请包",
      sidebar: "您的信息",
      complete: "所有信息已收集！",
    },
  },
  ko: {
    hero: {
      title: "텍사스 합의 이혼",
      subtitle: "간편하게",
      description: "이혼 서류를 쉬운 언어로 준비하고 설명합니다. 간단한 합의 이혼에는 변호사가 필요 없습니다.",
      cta: "자격 확인하기",
      fee: "일회성 수수료 $99 · 숨겨진 비용 없음"
    },
    howItWorks: {
      title: "이용 방법",
      subtitle: "질문에 답하고, 서류를 받고, 법원에 제출하세요.",
      steps: [
        { title: "자격 확인", desc: "몇 가지 질문에 답하여 이 서비스가 적합한지 확인하세요." },
        { title: "$99 결제", desc: "일회성 결제. 숨겨진 수수료 없음. 구독 없음." },
        { title: "서류 받기", desc: "제출 준비가 된 완전한 서류 패키지를 받으세요." },
        { title: "질문하기", desc: "DivorceGPT를 사용하여 절차의 어떤 부분이든 이해하세요." }
      ]
    },
    eligibilitySection: {
      title: "이 서비스가 적합한가요?",
      subtitle: "이 서비스는 다음 조건의 텍사스 합의 이혼을 위한 것입니다:",
      items: [
        "미성년 자녀가 없고 임신하지 않은 경우",
        "분할할 부동산이 없는 경우",
        "배우자 부양비를 요청하지 않는 경우",
        "양측 모두 이혼에 동의하는 경우",
        "최소 한 배우자: 텍사스 6개월 거주",
        "최소 한 배우자: 제출 카운티 90일 거주",
        "양측 모두 현역 군인이 아닌 경우"
      ],
      cta: "자격 확인하기"
    },
    faq: {
      title: "자주 묻는 질문",
      items: [
        { q: "이것은 법률 자문인가요?", a: "아닙니다. DivorceGPT는 이혼 서류가 무엇을 요구하는지, 어떻게 제출하는지 설명합니다. 법률 자문을 제공하지 않습니다. 법률 자문이 필요하면 변호사에게 상담하세요." },
        { q: "DivorceGPT는 어떤 기술을 사용하나요?", a: "DivorceGPT는 안전한 상용 API를 통해 고급 AI 기술을 사용합니다. API 제공업체의 약관에 따라 귀하의 입력은 AI 모델 학습에 사용되지 않으며 며칠 내에 자동 삭제됩니다. June Guided Solutions, LLC(DivorceGPT 운영 회사)는 채팅 기록이나 대화 데이터를 일절 보관하지 않습니다. 지원이 필요한 경우 대화 스크린샷을 직접 제공해야 합니다 — 저희는 대화를 복구할 수 없습니다." },
        { q: "절차에 얼마나 걸리나요?", a: "서류 작성은 몇 분이면 됩니다. 텍사스는 제출일로부터 60일의 의무 대기 기간이 있습니다. 세션은 12개월간 유효합니다." },
        { q: "세션에 어떻게 접근하나요?", a: "결제 후 세션 페이지로 이동됩니다. 이 페이지를 북마크하세요 — URL이 접근 링크입니다. 계정이나 비밀번호가 없습니다." },
        { q: "배우자가 협조하지 않으면 어떻게 하나요?", a: "이 서비스는 양측이 동의하는 합의 이혼을 위한 것입니다. 배우자가 협조하지 않으면 분쟁 이혼 변호사가 필요할 수 있습니다." },
        { q: "환불 받을 수 있나요?", a: "자격 확인 후 자격이 없으면 요금이 부과되지 않습니다. 서류가 생성되면 환불이 불가능합니다." }
      ]
    },
    qualify: {
      title: "자격 확인",
      subtitle: "이 서비스가 귀하의 상황에 적합한지 확인하기 위해 질문에 답하세요.",
      successTitle: "자격이 있습니다!",
      successMsg: "귀하의 답변을 기반으로, 텍사스 합의 이혼 서비스를 이용할 자격이 있습니다.",
      failTitle: "자격 없음",
      failMsg: "귀하의 답변을 기반으로, 이 서비스는 적합하지 않을 수 있습니다.",
      yes: "예",
      no: "아니요",
      submit: "자격 확인",
      continue: "결제 계속하기",
      back: "홈으로 돌아가기",
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "서류 도우미",
      welcome: "DivorceGPT에 오신 것을 환영합니다",
      intro: "텍사스 이혼 서류, 요구 사항, 제출 방법에 대해 도움을 드릴 수 있습니다.",
      placeholder: "이혼 서류에 대해 질문하세요...",
      send: "보내기",
      generating: "문서 생성 중...",
      download: "서류 패키지 다운로드",
      sidebar: "귀하의 정보",
      complete: "모든 정보가 수집되었습니다!",
    },
  },
  // Vietnamese mapped to 'ht' slot
  ht: {
    hero: {
      title: "Ly Hôn Thuận Tình Tại Texas",
      subtitle: "Đơn Giản Hóa",
      description: "Chuẩn bị và giải thích các biểu mẫu ly hôn bằng ngôn ngữ dễ hiểu. Không cần luật sư cho các trường hợp đơn giản.",
      cta: "Kiểm Tra Điều Kiện",
      fee: "Phí một lần $99 • Không có chi phí ẩn"
    },
    howItWorks: {
      title: "Cách Thức Hoạt Động",
      subtitle: "Trả lời câu hỏi, nhận biểu mẫu, nộp hồ sơ cho tòa án.",
      steps: [
        { title: "Kiểm Tra Điều Kiện", desc: "Trả lời một vài câu hỏi để xác nhận dịch vụ này phù hợp với bạn." },
        { title: "Thanh Toán $99", desc: "Thanh toán một lần. Không phí ẩn. Không đăng ký." },
        { title: "Nhận Biểu Mẫu", desc: "Nhận bộ hồ sơ hoàn chỉnh sẵn sàng nộp." },
        { title: "Đặt Câu Hỏi", desc: "Sử dụng DivorceGPT để hiểu bất kỳ phần nào của quy trình." }
      ]
    },
    eligibilitySection: {
      title: "Dịch Vụ Này Có Phù Hợp?",
      subtitle: "Dịch vụ này dành cho ly hôn thuận tình tại Texas với:",
      items: [
        "Không có con dưới 18 tuổi và không ai đang mang thai",
        "Không có bất động sản cần chia",
        "Không yêu cầu trợ cấp hôn nhân",
        "Cả hai vợ chồng đồng ý ly hôn",
        "Ít nhất một người: 6 tháng tại Texas",
        "Ít nhất một người: 90 ngày tại quận nộp đơn",
        "Không ai là quân nhân tại ngũ"
      ],
      cta: "Kiểm Tra Điều Kiện"
    },
    faq: {
      title: "Câu Hỏi Thường Gặp",
      items: [
        { q: "Đây có phải tư vấn pháp lý không?", a: "Không. DivorceGPT giải thích các biểu mẫu ly hôn yêu cầu gì và cách nộp. Không cung cấp tư vấn pháp lý. Nếu cần tư vấn pháp lý, hãy tham khảo luật sư." },
        { q: "DivorceGPT sử dụng công nghệ gì?", a: "DivorceGPT sử dụng công nghệ AI tiên tiến thông qua API thương mại an toàn. Theo điều khoản của nhà cung cấp API, dữ liệu đầu vào của bạn không được sử dụng để huấn luyện mô hình AI và tự động xóa trong vài ngày. June Guided Solutions, LLC (công ty đứng sau DivorceGPT) không lưu giữ bất kỳ lịch sử trò chuyện hoặc dữ liệu hội thoại nào. Nếu bạn cần hỗ trợ, bạn phải cung cấp ảnh chụp màn hình cuộc trò chuyện — chúng tôi không có cách nào để khôi phục nó." },
        { q: "Quy trình mất bao lâu?", a: "Bạn có thể hoàn thành biểu mẫu trong vài phút. Texas có thời gian chờ bắt buộc 60 ngày kể từ ngày nộp đơn. Phiên của bạn có hiệu lực trong 12 tháng." },
        { q: "Làm thế nào để truy cập phiên của tôi?", a: "Sau khi thanh toán, bạn sẽ được chuyển đến trang phiên. Đánh dấu trang này — URL là liên kết truy cập. Không cần tài khoản hay mật khẩu." },
        { q: "Nếu vợ/chồng không hợp tác thì sao?", a: "Dịch vụ này dành cho ly hôn thuận tình khi cả hai đồng ý. Nếu vợ/chồng không hợp tác, bạn có thể cần luật sư ly hôn tranh chấp." },
        { q: "Tôi có thể được hoàn tiền không?", a: "Nếu bạn không đủ điều kiện sau khi kiểm tra, bạn sẽ không bị tính phí. Khi biểu mẫu đã được tạo, không có hoàn tiền." }
      ]
    },
    qualify: {
      title: "Kiểm Tra Điều Kiện",
      subtitle: "Trả lời các câu hỏi để xác nhận dịch vụ này phù hợp với tình huống của bạn.",
      successTitle: "Bạn Đủ Điều Kiện!",
      successMsg: "Dựa trên câu trả lời, bạn đủ điều kiện sử dụng dịch vụ ly hôn thuận tình Texas.",
      failTitle: "Không Đủ Điều Kiện",
      failMsg: "Dựa trên câu trả lời, dịch vụ này có thể không phù hợp với tình huống của bạn.",
      yes: "Có",
      no: "Không",
      submit: "Kiểm Tra Điều Kiện",
      continue: "Tiếp Tục Thanh Toán",
      back: "Quay Lại Trang Chủ",
    },
    chat: {
      title: "DivorceGPT",
      subtitle: "Trợ Lý Biểu Mẫu",
      welcome: "Chào mừng đến DivorceGPT",
      intro: "Tôi có thể giúp giải thích biểu mẫu ly hôn Texas, yêu cầu và cách nộp.",
      placeholder: "Hỏi về biểu mẫu ly hôn...",
      send: "Gửi",
      generating: "Đang tạo tài liệu...",
      download: "Tải Bộ Hồ Sơ",
      sidebar: "Thông Tin Của Bạn",
      complete: "Tất cả thông tin đã được thu thập!",
    },
  },
};
