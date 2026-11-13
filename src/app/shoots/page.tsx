"use client";
import Float from "@/components/Float";
import ShootSuggestions from "@/components/ShootSuggestions";

export default function Shoots() {
  return (
    <div className="page">
      <header className="pagehead">
        <div>
          <h1 className="display lift">today&apos;s shoots</h1>
          <p className="lift">places around the city, ranked by the light and the weather right now. Each one has a subject, a technique and a lesson to practise.</p>
        </div>
      </header>
      <Float speed={0.02}><ShootSuggestions limit={30} full /></Float>
    </div>
  );
}
