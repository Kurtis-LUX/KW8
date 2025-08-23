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

  const socialLinks = [
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://www.instagram.com/palestra_kw8',
      color: 'text-pink-500 hover:text-pink-600'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/palestraKW8sortino',
      color: 'text-blue-500 hover:text-blue-600'
    },
    {
      name: 'Google',
      icon: Globe,
      url: 'https://maps.app.goo.gl/TkgDHdRp58FS4XbF6',
      color: 'text-green-500 hover:text-green-600'
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className={`py-12 bg-white transition-all duration-1200 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4 text-center">
        <h2 className={`text-4xl md:text-5xl font-bold text-navy-900 mb-8 transition-all duration-800 delay-200 transform ${
          isVisible 
            ? 'scale-100 opacity-100 rotate-0' 
            : 'scale-75 opacity-0 rotate-12'
        }`}>{t.followUs.toUpperCase()}</h2>
        
        <div className="flex justify-center space-x-12">
          {socialLinks.map((social, index) => {
            const Icon = social.icon;
            return (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${social.color} transition-all duration-700 transform hover:scale-125 hover:-translate-y-2 p-4 rounded-full hover:shadow-lg ${
                  isVisible 
                    ? 'translate-x-0 opacity-100' 
                    : index === 0 ? '-translate-x-20 opacity-0' : index === 1 ? 'translate-y-20 opacity-0' : 'translate-x-20 opacity-0'
                }`}
                style={{ transitionDelay: `${400 + index * 200}ms` }}
              >
                <Icon size={56} />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SocialSection;