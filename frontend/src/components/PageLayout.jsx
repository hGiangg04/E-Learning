import Navbar from './Navbar';
import Footer from './Footer';

export default function PageLayout({ children, className = '' }) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <main className={`flex-1 w-full ${className}`}>{children}</main>
      <Footer />
    </div>
  );
}
