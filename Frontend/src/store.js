const SEED = {
  users: [
    {
      user_id: 1,
      username: 'admin',
      email: 'admin@bookverse.vn',
      password_hash: 'admin123',
      full_name: 'Quản trị viên BookVerse',
      phone: '0901234560',
      role: 'ADMIN',
      status: 'ACTIVE',
      created_at: '2025-01-01T00:00:00Z',
      address: 'Toà nhà Tri Thức, 123 Đường Láng, Hà Nội',
    },
    {
      user_id: 2,
      username: 'khachhang1',
      email: 'an.nguyen@gmail.com',
      password_hash: 'pass123',
      full_name: 'Nguyễn Văn An',
      phone: '0901234561',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      created_at: '2025-03-10T08:00:00Z',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    },
    {
      user_id: 3,
      username: 'cuahang1',
      email: 'tritue@bookverse.vn',
      password_hash: 'pass123',
      full_name: 'Nhà Sách Trí Tuệ',
      phone: '0901234562',
      role: 'SHOP',
      status: 'ACTIVE',
      created_at: '2025-02-15T08:00:00Z',
      address: '456 Lê Lợi, Hoàn Kiếm, Hà Nội',
    },
    {
      user_id: 4,
      username: 'cuahang2',
      email: 'bookworld@gmail.com',
      password_hash: 'pass123',
      full_name: 'BookWorld HCM',
      phone: '0901234563',
      role: 'SHOP',
      status: 'ACTIVE',
      created_at: '2026-01-20T08:00:00Z',
      address: '789 Nguyễn Thị Minh Khai, Q.3, TP.HCM',
    },
    {
      user_id: 5,
      username: 'khachhang2',
      email: 'hung@gmail.com',
      password_hash: 'pass123',
      full_name: 'Phạm Thanh Hùng',
      phone: '0901234564',
      role: 'CUSTOMER',
      status: 'LOCKED',
      created_at: '2025-05-20T08:00:00Z',
      address: '321 Điện Biên Phủ, Q.3, TP.HCM',
    },
  ],
  shops: [
    {
      shop_id: 1,
      shop_name: 'Nhà Sách Trí Tuệ',
      user_id: 3,
      address: 'Hà Nội',
      condition: 'OPEN',
      rating: 4.9,
      status: 'APPROVED',
      category_focus: 'Sách kinh tế & phát triển bản thân',
      followers: '42.8k',
      book_count_text: '3.200',
      featured_tags: ['Đắc Nhân Tâm', 'Người Đua Diều'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop&q=80',
      description: 'Nhà sách chuyên cung cấp các đầu sách kinh tế, quản trị và tư duy đột phá hàng đầu.',
    },
    {
      shop_id: 2,
      shop_name: 'BookWorld HCM',
      user_id: 4,
      address: 'TP. Hồ Chí Minh',
      condition: 'OPEN',
      rating: 4.9,
      status: 'APPROVED',
      category_focus: 'Sách tiếng Anh & dịch thuật',
      followers: '68.4k',
      book_count_text: '5.800',
      featured_tags: ['Sapiens', 'Atomic Habits'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1507842229451-79b1be886a27?w=600&auto=format&fit=crop&q=80',
      description: 'Cửa hàng sách ngoại văn và các ấn bản dịch thuật cao cấp hàng đầu miền Nam.',
    },
    {
      shop_id: 3,
      shop_name: 'Sách Hay Mỗi Ngày',
      user_id: 3,
      address: 'Đà Nẵng',
      condition: 'OPEN',
      rating: 4.8,
      status: 'APPROVED',
      category_focus: 'Văn học trong và ngoài nước',
      followers: '19.2k',
      book_count_text: '1.400',
      featured_tags: ['Nhà Giả Kim', 'Mắt Biếc'],
      verified: false,
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=80',
      description: 'Tuyển tập những tác phẩm văn học chọn lọc giàu cảm xúc dành cho mọi độc giả.',
    },
    {
      shop_id: 4,
      shop_name: 'Alpha Books Store',
      user_id: 4,
      address: 'Hà Nội',
      condition: 'OPEN',
      rating: 4.8,
      status: 'APPROVED',
      category_focus: 'Khoa học & công nghệ',
      followers: '35.6k',
      book_count_text: '2.700',
      featured_tags: ['Tư Duy Nhanh', 'Công Nghệ AI'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?w=600&auto=format&fit=crop&q=80',
      description: 'Đối tác phát hành chính thức các dòng sách khoa học, trí tuệ nhân tạo và kinh doanh số.',
    },
    {
      shop_id: 5,
      shop_name: 'Tâm Linh Books',
      user_id: 3,
      address: 'TP. Hồ Chí Minh',
      condition: 'OPEN',
      rating: 4.7,
      status: 'APPROVED',
      category_focus: 'Tâm linh, tâm lý & thiền định',
      followers: '27.3k',
      book_count_text: '980',
      featured_tags: ['Thiền Tịnh', 'Hành Trình Về Phương Đông'],
      verified: false,
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      description: 'Không gian tĩnh lặng mang đến những tựa sách chữa lành và nuôi dưỡng tâm hồn.',
    },
    {
      shop_id: 6,
      shop_name: 'Sách Thiếu Nhi Vui',
      user_id: 4,
      address: 'Cần Thơ',
      condition: 'OPEN',
      rating: 4.9,
      status: 'APPROVED',
      category_focus: 'Sách thiếu nhi & giáo dục',
      followers: '15.8k',
      book_count_text: '1.200',
      featured_tags: ['Doremon', 'Kính Vạn Hoa'],
      verified: true,
      image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80',
      description: 'Thế giới truyện tranh, truyện cổ tích và sách khám phá khoa học cho thiếu nhi.',
    },
  ],
  categories: [
    { category_id: 1, category_name: 'Văn học', description: 'Tác phẩm văn học kinh điển và đương đại', status: true },
    { category_id: 2, category_name: 'Kinh tế', description: 'Sách kinh doanh, quản trị, đầu tư và tài chính', status: true },
    { category_id: 3, category_name: 'Khoa học', description: 'Sách khoa học vũ trụ, lịch sử và tự nhiên', status: true },
    { category_id: 4, category_name: 'Tâm lý', description: 'Sách tâm lý học hành vi, tư duy và phát triển bản thân', status: true },
    { category_id: 5, category_name: 'Thiếu nhi', description: 'Sách thiếu nhi, truyện tranh và nuôi dạy con', status: true },
    { category_id: 6, category_name: 'Ngoại ngữ', description: 'Sách học ngoại ngữ, từ điển và ấn phẩm quốc tế', status: true },
  ],
  books: [
    {
      book_id: 1,
      shop_id: 1,
      category_id: 4,
      title: 'Đắc Nhân Tâm',
      isbn: '978-604-1-00001-1',
      author: 'Dale Carnegie',
      publisher: 'NXB Tổng Hợp',
      shop_name: 'Nhà Sách Trí Tuệ',
      price: 89000,
      original_price: 120000,
      discount_percent: 26,
      tag: 'BÁN CHẠY',
      tag_bg: '#d97706',
      stock_quantity: 150,
      description: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử. Được xuất bản lần đầu vào năm 1936, đây là một trong những cuốn sách bán chạy nhất mọi thời đại với hơn 30 triệu bản được bán trên toàn thế giới.',
      cover_color: '#d9531e',
      cover_subtitle: 'JOURNEY TO SUCCESS',
      published_year: 1936,
      status: 'ACTIVE',
      rating: 4.9,
      reviews_count: 3820,
    },
    {
      book_id: 2,
      shop_id: 3,
      category_id: 1,
      title: 'Nhà Giả Kim',
      isbn: '978-604-1-00002-2',
      author: 'Paulo Coelho',
      publisher: 'NXB Hội Nhà Văn',
      shop_name: 'Sách Hay Mỗi Ngày',
      price: 75000,
      original_price: 95000,
      discount_percent: 21,
      tag: 'BÁN CHẠY',
      tag_bg: '#d97706',
      stock_quantity: 89,
      description: 'Tiểu thuyết triết lý nổi tiếng của tác giả người Brazil Paulo Coelho. Câu chuyện về hành trình tìm kiếm kho báu của chàng chăn cừu Santiago sẽ truyền cảm hứng cho mọi người dám theo đuổi giấc mơ của mình.',
      cover_color: '#c29b7f',
      cover_subtitle: 'THE SILENT ECHOES',
      published_year: 1988,
      status: 'ACTIVE',
      rating: 4.8,
      reviews_count: 2910,
    },
    {
      book_id: 3,
      shop_id: 2,
      category_id: 3,
      title: 'Sapiens: Lược Sử Loài Người',
      isbn: '978-604-1-00004-4',
      author: 'Yuval Noah Harari',
      publisher: 'NXB Tri Thức',
      shop_name: 'BookWorld HCM',
      price: 165000,
      original_price: 200000,
      discount_percent: 18,
      tag: 'NỔI BẬT',
      tag_bg: '#2563eb',
      stock_quantity: 45,
      description: 'Tác phẩm đột phá của Yuval Noah Harari về lịch sử loài người từ thời tiền sử đến hiện đại. Cuốn sách trả lời câu hỏi: điều gì đã làm cho loài người trở nên thống trị hành tinh này?',
      cover_color: '#f4f4f2',
      cover_text_color: '#1a1a1a',
      cover_subtitle: 'THE UNSEEN ARCHITECT',
      published_year: 2011,
      status: 'ACTIVE',
      rating: 4.9,
      reviews_count: 5240,
    },
    {
      book_id: 4,
      shop_id: 4,
      category_id: 4,
      title: 'Tư Duy Nhanh Và Chậm',
      isbn: '978-604-1-00014-4',
      author: 'Daniel Kahneman',
      publisher: 'NXB Thế Giới',
      shop_name: 'Alpha Books Store',
      price: 145000,
      original_price: 185000,
      discount_percent: 22,
      tag: 'NỔI BẬT',
      tag_bg: '#2563eb',
      stock_quantity: 60,
      description: 'Kiệt tác tâm lý học kinh tế học hành vi của nhà kinh tế học đoạt giải Nobel Daniel Kahneman, phân tích cách thức não bộ con người đưa ra quyết định.',
      cover_color: '#1a2942',
      cover_subtitle: 'MIND & BEHAVIOR',
      published_year: 2011,
      status: 'ACTIVE',
      rating: 4.7,
      reviews_count: 1870,
    },
    {
      book_id: 5,
      shop_id: 1,
      category_id: 2,
      title: 'Cha Giàu Cha Nghèo',
      isbn: '978-604-1-00005-5',
      author: 'Robert T. Kiyosaki',
      publisher: 'NXB Trẻ',
      shop_name: 'Nhà Sách Trí Tuệ',
      price: 108000,
      original_price: 135000,
      discount_percent: 20,
      tag: 'BÁN CHẠY',
      tag_bg: '#d97706',
      stock_quantity: 112,
      description: 'Cuốn sách về tài chính cá nhân được bán chạy nhất mọi thời đại. Robert Kiyosaki chia sẻ những bài học về tiền bạc mà ông học được từ hai người cha.',
      cover_color: '#4a235a',
      cover_subtitle: 'FINANCIAL FREEDOM',
      published_year: 1997,
      status: 'ACTIVE',
      rating: 4.8,
      reviews_count: 2341,
    },
    {
      book_id: 6,
      shop_id: 3,
      category_id: 1,
      title: 'Hoàng Tử Bé',
      isbn: '978-604-1-00006-6',
      author: 'Antoine de Saint-Exupéry',
      publisher: 'NXB Kim Đồng',
      shop_name: 'Sách Hay Mỗi Ngày',
      price: 55000,
      original_price: 70000,
      discount_percent: 21,
      tag: 'KINH ĐIỂN',
      tag_bg: '#059669',
      stock_quantity: 200,
      description: 'Tác phẩm kinh điển của nền văn học thế giới chứa đựng những triết lý sâu sắc về tình bạn, tình yêu và ý nghĩa cuộc sống.',
      cover_color: '#1e3d59',
      cover_subtitle: 'LE PETIT PRINCE',
      published_year: 1943,
      status: 'ACTIVE',
      rating: 5.0,
      reviews_count: 3210,
    },
    {
      book_id: 7,
      shop_id: 6,
      category_id: 5,
      title: 'Harry Potter và Hòn Đá Phù Thủy',
      isbn: '978-604-1-00007-7',
      author: 'J.K. Rowling',
      publisher: 'NXB Trẻ',
      shop_name: 'Sách Thiếu Nhi Vui',
      price: 120000,
      original_price: 150000,
      discount_percent: 20,
      tag: 'BÁN CHẠY',
      tag_bg: '#d97706',
      stock_quantity: 78,
      description: 'Tập đầu tiên trong bộ truyện huyền thoại Harry Potter và hành trình khám phá trường ma thuật Hogwarts.',
      cover_color: '#2b580c',
      cover_subtitle: 'WIZARDING WORLD',
      published_year: 1997,
      status: 'ACTIVE',
      rating: 4.9,
      reviews_count: 4521,
    },
    {
      book_id: 8,
      shop_id: 1,
      category_id: 4,
      title: 'Dám Nghĩ Lớn',
      isbn: '978-604-1-00008-8',
      author: 'David J. Schwartz',
      publisher: 'NXB Lao Động',
      shop_name: 'Nhà Sách Trí Tuệ',
      price: 88000,
      original_price: 110000,
      discount_percent: 20,
      tag: 'NỔI BẬT',
      tag_bg: '#2563eb',
      stock_quantity: 93,
      description: 'Cuốn sách truyền cảm hứng về sức mạnh của tư duy tích cực, giúp bạn tự tin đạt được mục tiêu lớn trong đời.',
      cover_color: '#8b0000',
      cover_subtitle: 'THE MAGIC OF THINKING BIG',
      published_year: 1959,
      status: 'ACTIVE',
      rating: 4.8,
      reviews_count: 632,
    },
    {
      book_id: 9,
      shop_id: 1,
      category_id: 2,
      title: 'Người Giàu Có Nhất Thành Babylon',
      isbn: '978-604-1-00009-9',
      author: 'George S. Clason',
      publisher: 'NXB Tổng Hợp',
      shop_name: 'Nhà Sách Trí Tuệ',
      price: 79000,
      original_price: 99000,
      discount_percent: 20,
      tag: 'KINH TẾ',
      tag_bg: '#059669',
      stock_quantity: 134,
      description: 'Những bài học tài chính bất hủ được kể qua những câu chuyện cổ đại về thành phố Babylon huyền thoại.',
      cover_color: '#8c502b',
      cover_subtitle: 'ANCIENT WEALTH SECRETS',
      published_year: 1926,
      status: 'ACTIVE',
      rating: 4.8,
      reviews_count: 891,
    },
    {
      book_id: 10,
      shop_id: 3,
      category_id: 1,
      title: 'Chiếc Lược Ngà',
      isbn: '978-604-1-00010-0',
      author: 'Nguyễn Quang Sáng',
      publisher: 'NXB Văn Học',
      shop_name: 'Sách Hay Mỗi Ngày',
      price: 45000,
      original_price: 55000,
      discount_percent: 18,
      tag: 'VĂN HỌC VIỆT',
      tag_bg: '#6b7280',
      stock_quantity: 56,
      description: 'Truyện ngắn cảm động của nhà văn Nguyễn Quang Sáng về tình cha con trong chiến tranh.',
      cover_color: '#34495e',
      cover_subtitle: 'VIETNAMESE LITERATURE',
      published_year: 1966,
      status: 'ACTIVE',
      rating: 4.9,
      reviews_count: 478,
    },
    {
      book_id: 11,
      shop_id: 3,
      category_id: 1,
      title: 'Số Đỏ',
      isbn: '978-604-1-00011-1',
      author: 'Vũ Trọng Phụng',
      publisher: 'NXB Văn Học',
      shop_name: 'Sách Hay Mỗi Ngày',
      price: 65000,
      original_price: 80000,
      discount_percent: 19,
      tag: 'VĂN HỌC VIỆT',
      tag_bg: '#6b7280',
      stock_quantity: 43,
      description: 'Tiểu thuyết trào phúng nổi tiếng nhất của văn học Việt Nam phê phán xã hội thực dân phong kiến qua nhân vật Xuân Tóc Đỏ.',
      cover_color: '#7b1113',
      cover_subtitle: 'SATIRICAL MASTERPIECE',
      published_year: 1936,
      status: 'ACTIVE',
      rating: 4.7,
      reviews_count: 312,
    },
    {
      book_id: 12,
      shop_id: 3,
      category_id: 1,
      title: 'Tắt Đèn',
      isbn: '978-604-1-00012-2',
      author: 'Ngô Tất Tố',
      publisher: 'NXB Văn Học',
      shop_name: 'Sách Hay Mỗi Ngày',
      price: 52000,
      original_price: 65000,
      discount_percent: 20,
      tag: 'VĂN HỌC VIỆT',
      tag_bg: '#6b7280',
      stock_quantity: 61,
      description: 'Tiểu thuyết hiện thực phê phán xuất sắc của Ngô Tất Tố phản ánh nỗi khổ đau và ý chí quật cường của người nông dân qua nhân vật chị Dậu.',
      cover_color: '#2c3e50',
      cover_subtitle: 'CRITICAL REALISM',
      published_year: 1939,
      status: 'ACTIVE',
      rating: 4.8,
      reviews_count: 267,
    },
  ],
  orders: [
    {
      order_id: 1,
      user_id: 2,
      total_amount: 164000,
      order_status: 'DELIVERED',
      payment_status: 'PAID',
      payment_method: 'COD',
      shipping_address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      created_at: '2026-07-15T08:00:00Z',
      updated_at: '2026-07-20T15:00:00Z',
      note: 'Giao giờ hành chính',
      details: [
        { order_detail_id: 1, order_id: 1, book_id: 1, quantity: 1, price: 89000, return_status: 'NONE' },
        { order_detail_id: 2, order_id: 1, book_id: 2, quantity: 1, price: 75000, return_status: 'NONE' },
      ],
    },
    {
      order_id: 2,
      user_id: 2,
      total_amount: 165000,
      order_status: 'PENDING',
      payment_status: 'UNPAID',
      payment_method: 'COD',
      shipping_address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      created_at: '2026-08-08T10:00:00Z',
      updated_at: '2026-08-08T10:00:00Z',
      note: 'Gọi trước khi giao',
      details: [
        { order_detail_id: 3, order_id: 2, book_id: 3, quantity: 1, price: 165000, return_status: 'NONE' },
      ],
    },
  ],
  carts: {
    2: [
      { book_id: 1, quantity: 1 },
      { book_id: 3, quantity: 1 },
      { book_id: 4, quantity: 1 },
    ],
  },
  feedbacks: [
    {
      feedback_id: 1,
      shop_id: 1,
      order_detail_id: 1,
      book_id: 1,
      user_id: 2,
      rating: 5,
      content: 'Sách rất hay, đóng gói cẩn thận bằng bìa carton cứng cáp. Bìa sách in sắc nét, thơm mùi giấy mới. Rất hài lòng với dịch vụ của shop!',
      created_at: '2026-07-21T09:00:00Z',
      responses: [
        {
          response_id: 1,
          feedback_id: 1,
          shop_id: 1,
          content: 'Nhà Sách Trí Tuệ chân thành cảm ơn bạn đã ủng hộ. Chúc bạn có những phút giây đọc sách thật nhiều cảm hứng!',
          created_at: '2026-07-21T10:30:00Z',
        },
      ],
    },
    {
      feedback_id: 2,
      shop_id: 3,
      order_detail_id: 2,
      book_id: 2,
      user_id: 2,
      rating: 4,
      content: 'Bản dịch Nhà Giả Kim mượt mà, bìa rất đẹp. Trừ 1 sao vì đơn vị giao hàng hơi chậm hơn dự kiến 1 ngày.',
      created_at: '2026-07-22T08:00:00Z',
      responses: [],
    },
  ],
  returnRequests: [],
  notifications: [
    { notification_id: 1, user_id: 2, message: 'Đơn hàng #1 đã được giao thành công. Cảm ơn bạn đã tin chọn BookVerse!', read: false, created_at: '2026-07-20T15:00:00Z' },
    { notification_id: 2, user_id: 2, message: 'Đơn hàng #2 của bạn đang chờ xác nhận từ shop.', read: false, created_at: '2026-08-08T10:00:00Z' },
    { notification_id: 3, user_id: 3, message: 'Bạn có đơn hàng mới #2 từ khách hàng Nguyễn Văn An.', read: false, created_at: '2026-08-08T10:00:00Z' },
  ],
  disputes: [
    {
      dispute_id: 1,
      order_id: 1,
      user_id: 2,
      issue_type: 'Giao hàng trễ',
      description: 'Đơn hàng giao chậm hơn 2 ngày so với thời gian ước tính trên app.',
      admin_resolution_note: '',
      status: 'OPEN',
      created_at: '2026-07-21T07:00:00Z',
    },
  ],
  transactions: [
    { transaction_id: 1, user_id: 2, order_id: 1, amount: 164000, transaction_type: 'COD', paid_by: 'CUSTOMER', transaction_code: 'TX-COD-1001', created_at: '2026-07-20T15:00:00Z' },
    { transaction_id: 2, user_id: 3, order_id: 1, amount: 140000, transaction_type: 'SHOP_REVENUE', paid_by: 'PLATFORM', transaction_code: 'TX-REV-1002', created_at: '2026-07-21T08:00:00Z' },
  ],
  nextIds: {
    user: 6,
    shop: 7,
    book: 13,
    order: 3,
    orderDetail: 4,
    feedback: 3,
    response: 2,
    returnRequest: 1,
    notification: 4,
    dispute: 2,
    transaction: 3,
  },
};

const KEY = 'bookverse_mall_data_v2';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const seed = JSON.parse(JSON.stringify(SEED));
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function nextId(data, entity) {
  const id = data.nextIds[entity] ?? 1;
  data.nextIds[entity] = id + 1;
  return id;
}

// ── User API ─────────────────────────────────────────
export function getUsers() {
  return load().users;
}

export function getUserById(id) {
  return load().users.find((u) => u.user_id === id) ?? null;
}

export function loginUser(username, password) {
  return (
    load().users.find(
      (u) =>
        (u.username === username || u.email === username) &&
        u.password_hash === password &&
        u.status !== 'LOCKED'
    ) ?? null
  );
}

export function registerUser(data) {
  const db = load();
  if (db.users.find((u) => u.username === data.username)) {
    return { error: 'Tên đăng nhập đã tồn tại trên hệ thống' };
  }
  if (db.users.find((u) => u.email === data.email)) {
    return { error: 'Địa chỉ email đã được sử dụng' };
  }
  const user = {
    user_id: nextId(db, 'user'),
    username: data.username,
    email: data.email,
    password_hash: data.password,
    full_name: data.full_name,
    phone: data.phone || '',
    address: data.address || '',
    role: data.role || 'CUSTOMER',
    status: data.role === 'SHOP' ? 'PENDING' : 'ACTIVE',
    created_at: new Date().toISOString(),
  };
  db.users.push(user);

  if (data.role === 'SHOP') {
    const shop = {
      shop_id: nextId(db, 'shop'),
      shop_name: data.full_name + ' BookStore',
      user_id: user.user_id,
      address: data.address || 'Hà Nội',
      condition: 'OPEN',
      rating: 5.0,
      status: 'PENDING',
      category_focus: 'Sách tổng hợp',
      followers: '0',
      book_count_text: '0',
      featured_tags: ['Sách Mới'],
      verified: false,
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop&q=80',
      description: 'Cửa hàng sách mới đăng ký trên nền tảng BookVerse.',
    };
    db.shops.push(shop);
  }

  save(db);
  return { user };
}

export function updateUserStatus(userId, status) {
  const db = load();
  const u = db.users.find((u) => u.user_id === userId);
  if (u) {
    u.status = status;
    save(db);
  }
}

export function updateProfile(userId, patch) {
  const db = load();
  const u = db.users.find((u) => u.user_id === userId);
  if (u) {
    Object.assign(u, patch);
    save(db);
  }
}

// ── Shop API ─────────────────────────────────────────
export function getShops() {
  return load().shops;
}

export function getShopByUserId(userId) {
  return load().shops.find((s) => s.user_id === userId) ?? null;
}

export function getShopById(shopId) {
  return load().shops.find((s) => s.shop_id === shopId) ?? null;
}

export function updateShopStatus(shopId, status) {
  const db = load();
  const s = db.shops.find((s) => s.shop_id === shopId);
  if (s) {
    s.status = status;
    const owner = db.users.find((u) => u.user_id === s.user_id);
    if (owner) {
      owner.status = status === 'APPROVED' ? 'ACTIVE' : 'LOCKED';
    }
    save(db);
  }
}

export function updateShop(shopId, patch) {
  const db = load();
  const s = db.shops.find((s) => s.shop_id === shopId);
  if (s) {
    Object.assign(s, patch);
    save(db);
  }
}

// ── Category API ─────────────────────────────────────
export function getCategories() {
  return load().categories.filter((c) => c.status);
}

// ── Book API ─────────────────────────────────────────
export function getBooks(shopId) {
  const db = load();
  return db.books.filter((b) =>
    shopId === undefined ? b.status === 'ACTIVE' : b.shop_id === shopId
  );
}

export function getBookById(id) {
  return load().books.find((b) => b.book_id === id) ?? null;
}

export function addBook(book) {
  const db = load();
  const b = {
    ...book,
    book_id: nextId(db, 'book'),
    rating: 5.0,
    reviews_count: 0,
    discount_percent: 0,
    original_price: book.price,
  };
  db.books.unshift(b);
  save(db);
  return b;
}

export function updateBook(bookId, patch) {
  const db = load();
  const b = db.books.find((b) => b.book_id === bookId);
  if (b) {
    Object.assign(b, patch);
    save(db);
  }
}

export function deleteBook(bookId) {
  const db = load();
  const b = db.books.find((b) => b.book_id === bookId);
  if (b) {
    b.status = 'HIDDEN';
    save(db);
  }
}

// ── Cart API ─────────────────────────────────────────
export function getCart(userId) {
  if (!userId) return [];
  return load().carts[userId] ?? [];
}

export function addToCart(userId, bookId, qty = 1) {
  const db = load();
  if (!db.carts[userId]) db.carts[userId] = [];
  const item = db.carts[userId].find((i) => i.book_id === bookId);
  if (item) {
    item.quantity += qty;
  } else {
    db.carts[userId].push({ book_id: bookId, quantity: qty });
  }
  save(db);
}

export function updateCartItem(userId, bookId, qty) {
  const db = load();
  if (!db.carts[userId]) db.carts[userId] = [];
  if (qty <= 0) {
    db.carts[userId] = db.carts[userId].filter((i) => i.book_id !== bookId);
  } else {
    const item = db.carts[userId].find((i) => i.book_id === bookId);
    if (item) item.quantity = qty;
  }
  save(db);
}

export function removeFromCart(userId, bookId) {
  const db = load();
  db.carts[userId] = (db.carts[userId] ?? []).filter((i) => i.book_id !== bookId);
  save(db);
}

export function clearCart(userId) {
  const db = load();
  db.carts[userId] = [];
  save(db);
}

// ── Order API ────────────────────────────────────────
export function getOrders(userId, shopId) {
  const db = load();
  let orders = db.orders;
  if (userId) {
    orders = orders.filter((o) => o.user_id === userId);
  }
  if (shopId) {
    const bookIds = db.books.filter((b) => b.shop_id === shopId).map((b) => b.book_id);
    orders = orders.filter((o) => o.details.some((d) => bookIds.includes(d.book_id)));
  }
  return [...orders].sort((a, b) => b.order_id - a.order_id);
}

export function getOrderById(id) {
  return load().orders.find((o) => o.order_id === id) ?? null;
}

export function createOrder(userId, items, address, method, note) {
  const db = load();
  const details = items.map((item) => {
    const book = db.books.find((b) => b.book_id === item.book_id);
    const price = book ? book.price : 50000;
    const det = {
      order_detail_id: nextId(db, 'orderDetail'),
      order_id: 0,
      book_id: item.book_id,
      quantity: item.quantity,
      price,
      return_status: 'NONE',
    };
    if (book && book.stock_quantity >= item.quantity) {
      book.stock_quantity -= item.quantity;
    }
    return det;
  });

  const total = details.reduce((s, d) => s + d.price * d.quantity, 0);
  const order = {
    order_id: nextId(db, 'order'),
    user_id: userId,
    total_amount: total,
    order_status: 'PENDING',
    payment_status: method === 'ONLINE' ? 'PAID' : 'UNPAID',
    payment_method: method,
    shipping_address: address,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    note: note || '',
    details,
  };
  details.forEach((d) => {
    d.order_id = order.order_id;
  });

  db.orders.unshift(order);
  db.carts[userId] = [];
  addNotification(db, userId, `Đơn hàng #${order.order_id} của bạn đã được khởi tạo thành công.`);
  save(db);
  return order;
}

export function updateOrderStatus(orderId, status) {
  const db = load();
  const o = db.orders.find((o) => o.order_id === orderId);
  if (o) {
    o.order_status = status;
    o.updated_at = new Date().toISOString();
    if (status === 'DELIVERED') o.payment_status = 'PAID';
    if (status === 'CANCELLED') {
      o.payment_status = o.payment_method === 'ONLINE' ? 'REFUNDED' : 'UNPAID';
    }
    addNotification(db, o.user_id, `Đơn hàng #${orderId} đã cập nhật trạng thái: ${status}`);
    save(db);
  }
}

export function cancelOrder(orderId) {
  updateOrderStatus(orderId, 'CANCELLED');
}

// ── Feedback API ─────────────────────────────────────
export function getFeedbacks(bookId) {
  const db = load();
  return bookId !== undefined
    ? db.feedbacks.filter((f) => f.book_id === bookId)
    : db.feedbacks;
}

export function getFeedbacksByShop(shopId) {
  return load().feedbacks.filter((f) => f.shop_id === shopId);
}

export function addFeedback(data) {
  const db = load();
  const fb = {
    ...data,
    feedback_id: nextId(db, 'feedback'),
    responses: [],
    created_at: new Date().toISOString(),
  };
  db.feedbacks.unshift(fb);
  const book = db.books.find((b) => b.book_id === data.book_id);
  if (book) {
    const all = db.feedbacks.filter((f) => f.book_id === data.book_id);
    book.rating = parseFloat((all.reduce((s, f) => s + f.rating, 0) / all.length).toFixed(1));
    book.reviews_count = all.length;
  }
  save(db);
  return fb;
}

export function addResponse(feedbackId, shopId, content) {
  const db = load();
  const fb = db.feedbacks.find((f) => f.feedback_id === feedbackId);
  if (fb) {
    const r = {
      response_id: nextId(db, 'response'),
      feedback_id: feedbackId,
      shop_id: shopId,
      content,
      created_at: new Date().toISOString(),
    };
    fb.responses.push(r);
    save(db);
  }
}

// ── Return Request API ───────────────────────────────
export function getReturnRequests(orderId) {
  const db = load();
  return orderId !== undefined
    ? db.returnRequests.filter((r) => r.order_id === orderId)
    : db.returnRequests;
}

export function addReturnRequest(data) {
  const db = load();
  const req = {
    ...data,
    return_request_id: nextId(db, 'returnRequest'),
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };
  db.returnRequests.unshift(req);
  const det = db.orders.flatMap((o) => o.details).find((d) => d.order_detail_id === data.order_detail_id);
  if (det) det.return_status = 'REQUESTED';
  save(db);
  return req;
}

export function updateReturnStatus(reqId, status) {
  const db = load();
  const req = db.returnRequests.find((r) => r.return_request_id === reqId);
  if (req) {
    req.status = status;
    save(db);
  }
}

// ── Notifications API ────────────────────────────────
function addNotification(db, userId, message) {
  db.notifications.unshift({
    notification_id: nextId(db, 'notification'),
    user_id: userId,
    message,
    read: false,
    created_at: new Date().toISOString(),
  });
}

export function getNotifications(userId) {
  return load().notifications.filter((n) => n.user_id === userId);
}

export function markAllRead(userId) {
  const db = load();
  db.notifications.filter((n) => n.user_id === userId).forEach((n) => {
    n.read = true;
  });
  save(db);
}

// ── Disputes API ─────────────────────────────────────
export function getDisputes() {
  return load().disputes;
}

export function addDispute(data) {
  const db = load();
  const d = {
    ...data,
    dispute_id: nextId(db, 'dispute'),
    admin_resolution_note: '',
    status: 'OPEN',
    created_at: new Date().toISOString(),
  };
  db.disputes.unshift(d);
  save(db);
  return d;
}

export function resolveDispute(disputeId, note) {
  const db = load();
  const d = db.disputes.find((d) => d.dispute_id === disputeId);
  if (d) {
    d.admin_resolution_note = note;
    d.status = 'CLOSED';
    save(db);
  }
}

// ── Revenue Statistics API ───────────────────────────
export function getRevenue(shopId) {
  const db = load();
  const bookIds = db.books.filter((b) => b.shop_id === shopId).map((b) => b.book_id);
  const delivered = db.orders.filter((o) => o.order_status === 'DELIVERED');
  const revenue = {};
  let total = 0;
  for (const o of delivered) {
    const month = o.created_at.slice(0, 7);
    const amount = o.details
      .filter((d) => bookIds.includes(d.book_id))
      .reduce((s, d) => s + d.price * d.quantity, 0);
    revenue[month] = (revenue[month] ?? 0) + amount;
    total += amount;
  }
  return { byMonth: revenue, total };
}

export function resetData() {
  localStorage.removeItem(KEY);
}
