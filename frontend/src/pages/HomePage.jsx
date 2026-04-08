import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import FeaturedCourses from '../components/FeaturedCourses';
import Stats from '../components/Stats';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Categories />
        <FeaturedCourses />
        <Stats />
      </main>
      <Footer />
    </div>
  );
}
