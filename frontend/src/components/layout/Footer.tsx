import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer id="footer-section" className="bg-foreground text-background">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8">
          {/* Brand */}
          <div>
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
