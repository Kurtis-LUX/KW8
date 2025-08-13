import React from 'react';
import { Instagram, Facebook, Globe } from 'lucide-react';

const SocialSection: React.FC = () => {
  const socialLinks = [
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://www.instagram.com/palestra_kw8',
      color: 'hover:text-pink-600'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/palestraKW8sortino',
      color: 'hover:text-blue-600'
    },
    {
      name: 'Google',
      icon: Globe,
      url: 'https://maps.app.goo.gl/TkgDHdRp58FS4XbF6',
      color: 'hover:text-green-600'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-16 animate-fadeInUp">SEGUICI SU</h2>
        
        <div className="flex justify-center space-x-12">
          {socialLinks.map((social, index) => {
            const Icon = social.icon;
            return (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-navy-900 ${social.color} transition-all duration-300 transform hover:scale-125 hover:-translate-y-2 p-4 rounded-full hover:shadow-lg`}
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