export interface Contact {
  linkedin?: string
  github?: string
  email?: string
  phone?: string
}

export interface Project {
  id: string
  title: string
  category: 'intro' | 'automation' | 'vibecoding' | 'video'
  shortDescription: string
  storyText: string
  tools: string[]
  images: string[]
  videos: string[]
  websiteUrl: string
  featured: boolean
  contact?: Contact
  /** Google Drive file ID — khi co se nhung video phat truc tiep trong modal */
  driveFileId?: string
}

const VIDEO_DRIVE = 'https://drive.google.com/drive/folders/1MjT-a6CzTy3pRLpP1H61tT5kkHQiY00w?usp=drive_link'

export const projects: Project[] = [
  // ====== AUTOMATION (N8N) — 5 ======
  {
    id: 'auto-telegram-crawl',
    title: 'Crawl Data Telegram',
    category: 'automation',
    shortDescription: 'Tự động thu thập & phân tích dữ liệu Telegram quy mô lớn — Modal + Telethon + n8n + Gemini, 5 workflow.',
    storyText: `Đây là hệ thống tự động thu thập và phân tích dữ liệu Telegram ở quy mô lớn mà không cần đọc thủ công từng tin nhắn. Hệ thống có khả năng lấy toàn bộ tin nhắn từ các kênh và nhóm Telegram, kèm theo metadata chi tiết như người gửi, thời gian, số reaction, lượt xem; đồng thời xác định những thành viên hoạt động tích cực nhất và đếm số lượng quản trị viên. Về kiến trúc, dự án kết hợp Modal (nền tảng serverless) để chạy tác vụ mà không cần duy trì server riêng, Telethon (thư viện Python kết nối Telegram), và n8n để điều phối luồng xử lý. Bên trong có 5 workflow chuyên biệt: Crawl channel - combine (crawl đa kênh kèm AI mở rộng từ khóa), Crawl Channel BD (phân tích nội dung bằng AI để phát hiện spam, đề cập sàn giao dịch, link giới thiệu), Ana Channel (thống kê chi tiết và đánh giá nội dung kênh bằng AI), Crawl Group BD_tele bot (giao diện bot Telegram để phân tích nhóm), và Crawl Group (tìm kiếm kênh theo từ khóa, hỗ trợ tiếng Việt và tiếng Indonesia). Toàn bộ tích hợp với Google Sheets và Gemini AI, dùng Python 3.11+.`,
    tools: ['n8n', 'Telethon', 'Modal', 'Gemini', 'AI/LLM'],
    images: ['/telegram-crawl-workflows.webp'],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/N8N-Vibecoding-Crawl-Data-Telegram',
    featured: true,
  },
  {
    id: 'auto-zalo',
    title: 'Workflows Zalo',
    category: 'automation',
    shortDescription: 'Tự động hóa Zalo OA: refresh token, webhook, đồng bộ khách hàng, gửi tin theo lịch, chatbot AI.',
    storyText: `Bộ workflow tự động hóa toàn diện cho nền tảng nhắn tin Zalo, phục vụ dự án OTIMO / Cẩm Nang Gối Lò. Hệ thống tự động làm mới access token của Zalo OA mỗi 24 giờ để duy trì kết nối liên tục, xử lý các sự kiện webhook (theo dõi/bỏ theo dõi/tin nhắn đến từ Official Account), đồng bộ và lấy thông tin khách hàng giữa nhiều nền tảng theo cơ chế phân trang (50 người dùng mỗi trang). Ngoài ra, workflow còn gửi tin nhắn và video theo lịch định sẵn vào các nhóm Zalo (bài đăng tài liệu và bài theo mùa hằng ngày), tự động xử lý lời mời kết bạn kèm hướng dẫn vào nhóm bằng AI, và vận hành một chatbot AI để trả lời khách hàng tự động. Hệ thống tích hợp Google Sheets, Larkbase (công cụ quản lý dự án), lưu trữ Cloudflare R2 và Google Gemini AI; có khả năng xử lý/upload ảnh-video và tự động cắt tin nhắn ở mốc 480 từ để phù hợp giới hạn nền tảng. Repo gồm 10 file workflow JSON kèm tài liệu mô tả chi tiết trigger và luồng dữ liệu.`,
    tools: ['n8n', 'Zalo OA API', 'AI/LLM', 'Webhook'],
    images: ['/zalo-community.webp'],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/N8N-Workflows-Zalo',
    featured: false,
  },
  {
    id: 'auto-facebook',
    title: 'Workflows Facebook',
    category: 'automation',
    shortDescription: 'Tự động hóa Fanpage Facebook (~10 workflow): trả lời Messenger/bình luận bằng AI, vector store, quản lý token.',
    storyText: `Tập hợp khoảng 10 workflow n8n để tự động hóa vận hành Fanpage Facebook, tích hợp với Facebook Graph API và các dịch vụ liên quan. Các luồng chính gồm: xử lý tin nhắn Messenger đến (kết hợp AI và lưu vào cơ sở dữ liệu), tự động trả lời bình luận trên bài đăng bằng nội dung do AI tạo, các thao tác với bài viết (trích xuất thông tin bài, tự động lưu bài vào vector store, theo dõi reaction), quản lý token (tự động lấy và cập nhật page access token), và luồng tích hợp đồng bộ trạng thái hoàn tất sang bảng LarkSuite sau khi agent phản hồi. Về công nghệ, hệ thống dùng Supabase để lưu trữ dữ liệu, Redis để xử lý hàng đợi tin nhắn, LangChain cho phần AI, hỗ trợ tìm kiếm ngữ nghĩa qua vector embedding và quản lý bộ nhớ hội thoại để AI phản hồi theo ngữ cảnh. Dự án thuộc sở hữu riêng của OTIMO.`,
    tools: ['n8n', 'Facebook Graph API', 'AI/LLM', 'Vector Store'],
    images: ['/facebook-comments.webp'],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/N8N-Workflows-Facebook',
    featured: false,
  },
  {
    id: 'auto-wordpress',
    title: 'Workflows Wordpress',
    category: 'automation',
    shortDescription: 'Tự động đăng bài & sản phẩm lên WordPress/WooCommerce từ Google Sheets, tạo SEO & danh mục bằng AI.',
    storyText: `Bộ workflow tự động hóa việc quản lý nội dung và sản phẩm trên WordPress, gồm 4 luồng chính. Post New Articles tự động lấy bài viết từ Google Sheets và đăng lên WordPress hằng ngày lúc 13:00, bao gồm chuyển đổi nội dung sang định dạng Gutenberg HTML bằng AI, upload ảnh, tự động chọn danh mục và tạo metadata SEO. Post Old Articles xử lý việc đăng lại nội dung cũ từ kho lưu trữ, thiết kế để đăng vào cuối tuần với các bước xử lý tương tự. Create Categories quản lý việc tạo danh mục WordPress từ dữ liệu Google Sheets, xử lý cả danh mục cha lẫn danh mục con và tự động làm sạch quy ước đặt tên. Upload Products tích hợp với WooCommerce để thêm sản phẩm qua webhook hoặc trigger theo lịch, hỗ trợ cả sản phẩm đơn giản và sản phẩm biến thể kèm mô tả do AI hỗ trợ viết. Hệ thống dùng WordPress REST API, WooCommerce REST API, Google Sheets và OpenAI GPT; toàn bộ nội dung và thông tin sản phẩm được tổ chức trong Google Sheets với các bảng riêng cho bài viết, danh mục và sản phẩm.`,
    tools: ['n8n', 'WordPress', 'WooCommerce', 'Google Sheets', 'AI/LLM'],
    images: [],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/N8N-Workflows-Wordpress',
    featured: false,
  },
  {
    id: 'auto-other',
    title: 'Other Workflows',
    category: 'automation',
    shortDescription: 'Bộ workflow đa năng: RAG chatbot, dịch & lồng tiếng video, theo dõi KPI/KOL, đăng bài đa ngôn ngữ.',
    storyText: `Bộ sưu tập workflow đa năng cho quản lý bot Telegram, phân phối nội dung và xử lý bằng AI. Loveable - Webhook đồng bộ workflow giữa n8n và Loveable thông qua Supabase, xử lý cập nhật và xóa qua HTTP POST. Supabase RAG AI Agent xây dựng chatbot theo cơ chế retrieval-augmented generation, dùng Supabase làm vector database, xử lý tài liệu từ Google Drive, tạo embedding và trả lời câu hỏi dựa trên nội dung lưu trữ liên quan. Video Translation chuyển nội dung video/audio sang giọng nói tiếng Việt bằng cách phiên âm, dịch qua Google Gemini và tổng hợp giọng nói với ElevenLabs. Hệ thống bot chuyên biệt gồm Private-TG-Tracker (theo dõi KPI và hoạt động của KOL/influencer — Bot Listen ghi nhận thời điểm creator đăng bài, đo thời gian phản hồi và cập nhật bảng hiệu suất; Bot group BD_Send phân phối bài tới influencer kèm mã giới thiệu) và TG-MultiHub-Auto (đăng bài đa ngôn ngữ qua các kênh Telegram tiếng Nga, Trung, Indonesia, Việt — kèm kiểm duyệt nội dung, phân tích cảm xúc và tính toán rủi ro/lợi nhuận cho tín hiệu tài chính; workflow Phân tích xử lý chỉ số giao dịch và tạo bản tóm tắt). Tất cả tích hợp Supabase, Google Sheets, Telegram API và các dịch vụ AI như OpenAI, Gemini.`,
    tools: ['n8n', 'Supabase', 'RAG', 'Telegram', 'AI/LLM'],
    images: [],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/N8N-Other-Workflows',
    featured: false,
  },

  // ====== VIBECODING — 7 ======
  {
    id: 'vibe-detective-suitcase',
    title: '3D Portfolio — Detective Suitcase',
    category: 'vibecoding',
    shortDescription: 'Portfolio cá nhân 3D theo concept "vali thám tử" — React + TypeScript + Vite.',
    storyText: `Một trang portfolio cá nhân 3D xây dựng trên nền tảng web hiện đại, lấy concept "vali thám tử" làm chủ đề hình ảnh. Dự án được phát triển bằng React kết hợp TypeScript để có type-safe khi viết component, dùng Vite làm công cụ build và dev server với tính năng Hot Module Replacement (HMR), CSS cho phần styling. Tỷ lệ ngôn ngữ gồm TypeScript (75.3%), CSS (11.2%), JavaScript (11.1%) và HTML (2.4%). Dự án được triển khai (deploy) trực tiếp trên Vercel tại địa chỉ vibecoding-3-d-porfolio-detective-s.vercel.app, đi kèm cấu hình TypeScript, ESLint và công cụ phát triển; đây là một portfolio cá nhân đang ở giai đoạn đầu.`,
    tools: ['React', 'TypeScript', 'Vite', 'Three.js'],
    images: [],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/Vibecoding-3D-Porfolio-Detective_Suitcase',
    featured: false,
  },
  {
    id: 'vibe-water-puppets',
    title: 'Landing Page 3D — Vietnamese Water Puppets',
    category: 'vibecoding',
    shortDescription: 'Landing page 3D tương tác lấy cảm hứng Múa Rối Nước Việt Nam, giới thiệu dự án theo 3 mảng.',
    storyText: `Trang web portfolio cá nhân lấy cảm hứng từ loại hình nghệ thuật truyền thống Múa Rối Nước (Water Puppetry) của Việt Nam, mang đậm bản sắc văn hóa. Tác giả tổ chức công việc của mình thành ba mảng: Analysis (Phân tích), Automation (Tự động hóa) và AI projects (các dự án trí tuệ nhân tạo). Về công nghệ, dự án dùng React + TypeScript cho frontend, Three.js / React Three Fiber để tạo đồ họa 3D và các thành phần tương tác, cùng Vite làm build tool. Portfolio mang lại "trải nghiệm 3D tương tác" để giới thiệu các dự án của tác giả trải dài từ phân tích dữ liệu, giải pháp tự động hóa đến ứng dụng AI. Dự án viết chủ yếu bằng TypeScript (84%), CSS (10.3%) và JavaScript (5.4%), hiện vẫn đang được phát triển tích cực và có kèm video demo giao diện 3D.`,
    tools: ['React Three Fiber', 'Three.js', 'React', 'TypeScript', 'Vite'],
    images: ['/landing-water-puppets.webp'],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/Vibecoding-Ladingpage-3D-Vietnamese-water-puppets',
    featured: true,
  },
  {
    id: 'vibe-medng',
    title: 'Landing Page 3D - MEDNG',
    category: 'vibecoding',
    shortDescription: 'Landing 3D nhập vai "Dr. Dino" qua 6 phòng minh họa dữ liệu y tế phi tập trung (hackathon).',
    storyText: `Dự án hackathon trình bày một landing page 3D đắm chìm (immersive) cho nền tảng dữ liệu y tế phi tập trung. Người dùng nhập vai nhân vật "Dr. Dino" và di chuyển qua sáu căn phòng ảo theo chủ đề, mỗi phòng đại diện cho một công nghệ cốt lõi: quyền sở hữu dữ liệu tự quản (self-custody), mã hóa ngưỡng (threshold encryption), nhật ký kiểm toán trên blockchain, lưu trữ phân tán, xử lý cách ly bằng phần cứng và tuân thủ pháp lý. Về kỹ thuật, dự án dùng Three.js để render 3D thời gian thực, WebGL với custom GLSL shader cho hiệu ứng hình ảnh, Web Audio API cho thiết kế âm thanh, và toàn bộ đóng gói trong một file HTML/CSS/JavaScript triển khai mà không cần bước build. Trải nghiệm gồm điều hướng 3D bằng phím WASD, một nhân vật linh vật được dựng theo thủ tục (procedurally) kèm animation, cùng hiệu ứng nâng cao như bloom lighting và hệ thống hạt (particle). Thông điệp cốt lõi nhấn mạnh rằng bệnh nhân có thể toàn quyền sở hữu dữ liệu y tế của mình — không phụ thuộc bệnh viện, tập đoàn hay bên thứ ba — mà vẫn đảm bảo bảo mật và tuân thủ; người dùng học cách kiến trúc dữ liệu y tế phi tập trung vận hành thông qua tương tác trực tiếp thay vì đọc tài liệu tĩnh.`,
    tools: ['Three.js', 'WebGL', 'GLSL', 'React'],
    images: [],
    videos: [],
    driveFileId: '1sA4TNgREjcrmo-vau-0X-X7TN5-nECXk',
    websiteUrl: 'https://github.com/lamtuyen120903/Vibecoding-3D-MEDNG',
    featured: false,
  },
  {
    id: 'vibe-ecommerce-chatbot',
    title: 'AI Agent — E-commerce Chatbot',
    category: 'vibecoding',
    shortDescription: 'Chatbot AI thương mại điện tử: tư vấn sản phẩm, theo dõi đơn hàng, gợi ý cá nhân hóa. Đồ án tốt nghiệp.',
    storyText: `Một ứng dụng AI hội thoại được thiết kế để nâng cao trải nghiệm mua sắm, cho phép khách hàng trò chuyện với AI để tìm sản phẩm, hỏi về chi tiết và giá cả, đồng thời nhận hỗ trợ cá nhân hóa xuyên suốt hành trình mua hàng. Chatbot có ba tính năng chính: trợ lý mua sắm AI giúp khám phá và tư vấn sản phẩm, khả năng theo dõi đơn hàng để giám sát trạng thái và lịch sử mua hàng, và gợi ý cá nhân hóa dựa trên hành vi duyệt và mua của người dùng. Về công nghệ, frontend dùng Next.js và React, cơ sở dữ liệu là Supabase, giao diện xây trên Tailwind CSS với thư viện shadcn/ui, quản lý trạng thái bằng Zustand và triển khai trên Netlify. Mã nguồn chủ yếu là TypeScript (98.8%), được tổ chức rõ ràng theo các thư mục components, hooks, services và utilities để dễ bảo trì.`,
    tools: ['Next.js', 'Supabase', 'Tailwind CSS', 'shadcn/ui', 'AI/LLM'],
    images: [],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/AI-Agent-Ecommerce-Chatbot',
    featured: true,
  },
  {
    id: 'vibe-humanizer',
    title: 'Google Studio - AI Humanizer Pro — Rewrite Content',
    category: 'vibecoding',
    shortDescription: 'AI Humanizer Pro — viết lại / "nhân hóa" nội dung bằng Gemini API. React + Vite.',
    storyText: `Ứng dụng AI Studio mang tên "AI Humanizer Pro" có chức năng viết lại / "nhân hóa" nội dung, giúp văn bản tự nhiên và mượt hơn. Ứng dụng được triển khai tại ai-humanizer-pro.vercel.app và có thể xem trong AI Studio. Về công nghệ, dự án viết chủ yếu bằng TypeScript (97.7%) và HTML (2.3%), dùng Node.js cho phát triển cục bộ, Vite làm build tool, React cho giao diện và tích hợp Gemini API cho phần AI. Để chạy cục bộ, lập trình viên cần cài dependencies qua npm, cấu hình Gemini API key trong file .env.local rồi chạy npm run dev. Dự án có cấu trúc module hóa với các thư mục riêng cho components, services và utilities, được tổ chức gọn gàng cho ứng dụng chuyển đổi nội dung dựa trên Gemini AI của Google.`,
    tools: ['Gemini API', 'React', 'Vite', 'AI/LLM'],
    images: [],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/Google-Studio-Rewrite-Content',
    featured: false,
  },
  {
    id: 'vibe-fnb-bi',
    title: 'Google Studio - F&B BizIntel',
    category: 'vibecoding',
    shortDescription: 'App Business Intelligence cho ngành F&B, phân tích dữ liệu kinh doanh bằng AI (Google Studio).',
    storyText: `Ứng dụng business intelligence (BI) ứng dụng AI cho ngành thực phẩm và đồ uống (F&B), giúp phân tích dữ liệu kinh doanh. Ứng dụng được triển khai tại f-b-biz-intel.vercel.app, xây dựng dưới dạng app Google AI Studio và có thể xem trong giao diện studio. Về công nghệ, dự án chủ yếu là TypeScript (97.6%) và HTML (2.4%), dùng Vite làm build tool, React cho cấu trúc component và Gemini API cho chức năng AI. Ứng dụng cần Node.js và dùng npm để quản lý dependencies; cách chạy cục bộ gồm cài dependencies, cấu hình Gemini API key trong .env.local và chạy npm run dev. Mã nguồn gồm các component TypeScript, file cấu hình (tsconfig.json, vite.config.ts), hàm tiện ích và định nghĩa kiểu dữ liệu — được tổ chức theo quy trình phát triển web hiện đại.`,
    tools: ['Google AI Studio', 'React', 'Vite', 'AI/LLM'],
    images: ['/fnb-bizintel.webp'],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/Google-Studio-FnB-BI',
    featured: false,
  },
  {
    id: 'vibe-app-gen',
    title: 'Google Studio - AI Studio App Generator',
    category: 'vibecoding',
    shortDescription: 'App AI Studio nền tảng làm khung xây dựng & triển khai ứng dụng web AI.',
    storyText: `Một ứng dụng AI Studio nền tảng, đóng vai trò làm khung (foundation) để xây dựng và triển khai ứng dụng web ứng dụng AI, có thể chạy cục bộ lẫn deploy. Dự án viết chủ yếu bằng TypeScript (98.8%) và HTML (1.2%), dùng Node.js để chạy cục bộ, Vite làm build tool, React (qua các file .tsx) và tích hợp Gemini API. Theo README, repo "chứa mọi thứ bạn cần để chạy app cục bộ"; quy trình cài đặt gồm cài dependencies qua npm, cấu hình Gemini API key trong file môi trường và chạy dev server. Mã nguồn gồm các thư mục được tổ chức cho components và services cùng file cấu hình TypeScript và Vite; ứng dụng hiện được triển khai tại app-gen-anh.vercel.app.`,
    tools: ['Google AI Studio', 'React', 'Vite'],
    images: [],
    videos: [],
    websiteUrl: 'https://github.com/lamtuyen120903/Google-Studio-app-gen-anh',
    featured: false,
  },

  // ====== VIDEO (AI) — 6 ======
  {
    id: 'video-medng',
    title: 'MedNG',
    category: 'video',
    shortDescription: 'Video dự án hackathon MedNG — nền tảng dữ liệu y tế phi tập trung trên blockchain.',
    storyText: `Video sản phẩm của dự án hackathon, giới thiệu một hệ thống bệnh viện ứng dụng công nghệ blockchain nhằm đảm bảo thông tin y tế được bảo mật và chống giả mạo (tamper-proof). Đây là phiên bản video trình bày trực quan cho dự án MedNG — nền tảng dữ liệu y tế phi tập trung, dùng để thuyết trình và demo ý tưởng tại cuộc thi.`,
    tools: ['Codex', 'Remotion', 'AI Video'],
    images: [],
    videos: ['MedNG.mp4'],
    websiteUrl: VIDEO_DRIVE,
    driveFileId: '10-y088W0eIWD_N6RkMTkDV1URVnZlr5y',
    featured: true,
  },
  {
    id: 'video-sui',
    title: 'Sui Product',
    category: 'video',
    shortDescription: 'Video giới thiệu sản phẩm, dựng bằng Codex-Remotion.',
    storyText: `Video giới thiệu sản phẩm được sản xuất bằng quy trình Codex-Remotion (kết hợp AI sinh nội dung với thư viện Remotion để dựng video bằng code), trình bày sản phẩm một cách chuyên nghiệp và tự động hóa khâu dựng hình.`,
    tools: ['Codex', 'Remotion', 'AI Video'],
    images: [],
    videos: ['Sui_product.mp4'],
    websiteUrl: VIDEO_DRIVE,
    driveFileId: '1Ou13yNn8xADywNhhX4M_UkUDeByVOUa1',
    featured: false,
  },
  {
    id: 'video-smash-blob',
    title: 'Smash Blob',
    category: 'video',
    shortDescription: 'Video quảng bá sản phẩm "Smash Blob", dựng bằng Codex-Remotion.',
    storyText: `Video giới thiệu sản phẩm "Smash Blob", cũng được dựng bằng Codex-Remotion, minh họa khả năng tạo video quảng bá sản phẩm theo hướng lập trình hóa thay vì dựng thủ công.`,
    tools: ['Codex', 'Remotion', 'AI Video'],
    images: [],
    videos: ['Smash Blob.mp4'],
    websiteUrl: VIDEO_DRIVE,
    driveFileId: '1QUEjynE6X2yluBIhgMaFiMADvBdG6RgL',
    featured: false,
  },
  {
    id: 'video-mersi',
    title: 'Mersi',
    category: 'video',
    shortDescription: 'Video giới thiệu sản phẩm "Mersi", dựng bằng Codex-Remotion.',
    storyText: `Video giới thiệu sản phẩm "Mersi", sản xuất qua Codex-Remotion, tiếp tục thể hiện quy trình tạo video sản phẩm nhất quán và có thể tái sử dụng cho nhiều thương hiệu khác nhau.`,
    tools: ['Codex', 'Remotion', 'AI Video'],
    images: [],
    videos: ['Mersi.mp4'],
    websiteUrl: VIDEO_DRIVE,
    driveFileId: '14YGnEUYwfvnz-6r_Ph2VR8s66DbZknpM',
    featured: false,
  },
  {
    id: 'video-bakery-girl',
    title: 'Story of Bakery Girl',
    category: 'video',
    shortDescription: 'Video kể chuyện "cô gái tiệm bánh", tạo bằng công cụ AI trên Discord.',
    storyText: `Video kể chuyện sáng tạo với chủ đề "cô gái tiệm bánh", được tạo bằng công cụ AI trên Discord. Đây là sản phẩm thiên về storytelling/giải trí, thể hiện khả năng dùng AI để dựng nội dung kể chuyện có cốt truyện và hình ảnh.`,
    tools: ['AI Video', 'Discord'],
    images: [],
    videos: ['Story_of_barkery_girl.mp4'],
    websiteUrl: VIDEO_DRIVE,
    driveFileId: '1vyraMQ5gl6gbRffnAZ41aTptECVRh3qX',
    featured: false,
  },
  {
    id: 'video-bird',
    title: 'Story of Bird',
    category: 'video',
    shortDescription: 'Video kể chuyện về chú chim, tạo bằng công cụ AI trên Discord.',
    storyText: `Video kể chuyện về chú chim, cũng được tạo bằng công cụ AI trên Discord, tiếp nối dòng nội dung storytelling sáng tạo bằng AI sinh hình ảnh và video.`,
    tools: ['AI Video', 'Discord'],
    images: [],
    videos: ['story_of_bird.mp4'],
    websiteUrl: VIDEO_DRIVE,
    driveFileId: '17n6cif757mQWrTaTPITI3t9uYjzEpT2w',
    featured: false,
  },
]

export function getProjectsByCategory(category: Project['category']): Project[] {
  return projects.filter((p) => p.category === category)
}
