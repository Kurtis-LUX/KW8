import React, { useState, useEffect, useRef } from 'react';
import { Instagram, Facebook, Globe } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const SocialSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
        rootMargin: '30px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const socials = [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/palestra_kw8',
      gradient: 'linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)',
      icon: <Instagram size={24} />,
      description: 'Seguici su Instagram'
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/palestraKW8sortino',
      gradient: 'linear-gradient(135deg, #4c6ef5 0%, #228be6 100%)',
      icon: <Facebook size={24} />,
      description: 'Seguici su Facebook'
    },
    {
      name: 'Google',
      href: 'https://maps.app.goo.gl/TkgDHdRp58FS4XbF6',
      gradient: 'linear-gradient(135deg, #51cf66 0%, #20c997 100%)',
      icon: <Globe size={24} />,
      description: 'Trova la palestra su Google'
    }
  ];

  return (
    <section ref={sectionRef} className={`py-16 bg-white/80 backdrop-blur-sm transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="container mx-auto px-6 font-sfpro">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-navy-900 mb-4 animate-fadeInUp tracking-tight">
            {t.followUs}
          </h2>
          <p className="text-navy-700">
            {t.socialSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {socials.map((social, index) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/70 backdrop-blur-md rounded-2xl shadow-sm p-6 flex items-center space-x-4 transition-transform transform hover:scale-[1.02] hover:shadow-md border border-white/60"
              style={{ transitionDelay: `${200 + index * 150}ms` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white group-hover:rotate-3 transition-transform duration-300"
                style={{ background: social.gradient }}
              >
                {social.icon}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-navy-900">
                  {social.name}
                </h3>
                <p className="text-navy-700">
                  {social.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialSection;