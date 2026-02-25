import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  "Quick Links": [
    { label: "Home", href: "/" },
    { label: "Support", href: "/support" },
    { label: "Blog", href: "#" },
    { label: "FAQs", href: "#" },
  ],
  "Customer Service": [
    { label: "Track Order", href: "#" },
    { label: "Returns", href: "#" },
    { label: "Shipping Policy", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
  "Categories": [
    { label: "Mobiles", href: "/mobiles" },
    { label: "Accessories", href: "/collections/accessories" },
    { label: "Charging", href: "/collections/charging" },
    { label: "Audio", href: "/collections/audio" },
  ],
};

export const Footer = () => {
  return (
    <footer id="footer-section" className="bg-foreground text-background">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <img
                src="/vikashlovesmeppu.jpeg"
                alt="VikasTelecom"
                className="h-10 w-10 object-contain"
              />
              <span className="font-bold text-xl">
                Vikas<span className="text-primary">Telecom</span>
              </span>
            </a>
            <p className="text-background/60 text-sm leading-relaxed mb-6 max-w-sm">
              Your trusted destination for mobile and computer accessories. Quality products, competitive prices, and exceptional service.
            </p>
            <div className="space-y-2 text-sm text-background/60">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Shop No 3, Zaverchand Medhani Tower, University Rd, Rajkot 360005</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> <a href="tel:9327511512" className="hover:text-primary transition-colors">9327511512</a></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> <a href="mailto:vikastelecomnew2026@gmail.com" className="hover:text-primary transition-colors">vikastelecomnew2026@gmail.com</a></div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((item) => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-background/60 hover:text-primary transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-background/10">
        <div className="container-main py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/40">© 2026 VikasTelecom. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
