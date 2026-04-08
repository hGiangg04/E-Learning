import Navbar from '../components/Navbar';
import BannerCarousel from '../components/BannerCarousel';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import FeaturedCourses from '../components/FeaturedCourses';
import Stats from '../components/Stats';
import Footer from '../components/Footer';
import { usePublicStats } from '../hooks/usePublicStats';

export default function HomePage() {
  const publicStats = usePublicStats();

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full">
        <BannerCarousel />
        <Hero stats={publicStats} />
        <Categories />
        <FeaturedCourses />
        <Stats stats={publicStats} />
      </main>
      <Footer />
    </div>
  );
}
