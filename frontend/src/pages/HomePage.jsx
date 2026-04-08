import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BannerCarousel from '../components/BannerCarousel';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import FeaturedCourses from '../components/FeaturedCourses';
import Stats from '../components/Stats';
import Footer from '../components/Footer';
import { statsService } from '../api/statsService';

export default function HomePage() {
  const [publicStats, setPublicStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const empty = {
      student_count: 0,
      course_count: 0,
      instructor_count: 0,
      completion_rate_percent: 0,
      average_rating: 0,
      spotlight_course: null,
    };
    statsService
      .getPublicStats()
      .then((data) => {
        if (!cancelled) setPublicStats(data);
      })
      .catch(() => {
        if (!cancelled) setPublicStats(empty);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
