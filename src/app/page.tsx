import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { BookOpen, Brain, PenLine, BarChart3, Zap, CheckCircle } from 'lucide-react'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuizViet</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Bắt đầu miễn phí
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Zap size={14} />
            Phương pháp học thông minh với Spaced Repetition
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Học từ vựng thông minh
            <span className="text-indigo-600 block">với QuizViet</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Nền tảng học từ vựng với 5 chế độ học khác nhau, thuật toán SM-2 spaced repetition,
            và theo dõi tiến trình học tập hàng ngày.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-lg font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
            >
              Bắt đầu miễn phí
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 text-lg font-semibold px-8 py-4 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">5 Chế độ học tập</h2>
            <p className="text-lg text-gray-500">Đa dạng phương pháp giúp bạn ghi nhớ từ vựng hiệu quả hơn</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Thẻ ghi nhớ',
                desc: 'Lật thẻ flash card với hiệu ứng 3D. Hỗ trợ phím tắt để học nhanh hơn.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Brain,
                title: 'Học (Spaced Repetition)',
                desc: 'Thuật toán SM-2 thông minh xác định từ nào bạn cần ôn luyện tiếp theo.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: PenLine,
                title: 'Tự luận',
                desc: 'Gõ đáp án từ định nghĩa. Chấm điểm từng ký tự, tô màu đúng/sai.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: BarChart3,
                title: 'Kiểm tra',
                desc: 'Tự động tạo đề kiểm tra với MCQ, điền từ, đúng/sai và ghép đôi.',
                color: 'bg-orange-50 text-orange-600',
              },
              {
                icon: Zap,
                title: 'Ghép thẻ',
                desc: 'Trò chơi ghép từ với định nghĩa theo thời gian. Thử thách bản thân!',
                color: 'bg-pink-50 text-pink-600',
              },
              {
                icon: CheckCircle,
                title: 'Đánh dấu đã biết',
                desc: 'Đánh dấu từ đã thuộc để tập trung ôn những từ chưa nhớ.',
                color: 'bg-indigo-50 text-indigo-600',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Cách sử dụng</h2>
            <p className="text-lg text-gray-500">Chỉ 3 bước đơn giản để bắt đầu</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Tạo bộ từ vựng', desc: 'Nhập các cặp thuật ngữ - định nghĩa hoặc import từ CSV' },
              { step: '2', title: 'Chọn chế độ học', desc: 'Thẻ ghi nhớ, học, tự luận, kiểm tra hoặc ghép thẻ' },
              { step: '3', title: 'Theo dõi tiến trình', desc: 'Xem chuỗi ngày học, thống kê và tiến bộ của bạn' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Sẵn sàng học chưa?</h2>
          <p className="text-indigo-200 mb-8">Tham gia cùng hàng nghìn người học đang dùng QuizViet</p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-white text-indigo-600 text-lg font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Đăng ký miễn phí ngay
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <BookOpen size={14} className="text-white" />
              </div>
              <span className="text-white font-bold">QuizViet</span>
            </div>
            <p className="text-sm">© 2024 QuizViet. Học từ vựng thông minh.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
