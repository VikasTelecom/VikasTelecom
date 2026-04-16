import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";

const Support = () => {
  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "vikastelecomnew2026@gmail.com",
      href: "mailto:vikastelecomnew2026@gmail.com",
    },
    {
      icon: Phone,
      label: "Mobile",
      value: "9327511512",
      href: "tel:9327511512",
    },
    {
      icon: MapPin,
      label: "Address",
      value: "Shop No 3, Zaverchand Medhani Tower, University Rd, Near Panchayat Chowk Rajkot 360005 Gujarat",
      href: null,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <CartDrawer />

      <main className="pt-20">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border py-12 md:py-16"
        >
          <div className="container-main">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Support & Contact
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              We're here to help! Get in touch with our team for any questions or concerns.
            </p>
          </div>
        </motion.section>

        {/* Contact Information */}
        <section className="py-16 md:py-24">
          <div className="container-main">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 mb-16"
            >
              {/* Left Column - Contact Details */}
              <div>
                <h2 className="text-3xl font-bold mb-8 text-foreground">
                  Get In Touch
                </h2>

                <motion.div variants={container} className="space-y-6">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <motion.div
                        key={index}
                        variants={item}
                        className="flex gap-4 group"
                      >
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {info.label}
                          </p>
                          {info.href ? (
                            <a
                              href={info.href}
                              className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {info.value}
                            </a>
                          ) : (
                            <p className="text-lg font-semibold text-foreground">
                              {info.value}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Right Column - Business Hours & Info */}
              <div>
                <h2 className="text-3xl font-bold mb-8 text-foreground">
                  Business Hours
                </h2>

                <motion.div
                  variants={container}
                  className="space-y-6 bg-muted/30 rounded-lg p-8 border border-border"
                >
                  <motion.div variants={item} className="flex items-start gap-4">
                    <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground mb-2">
                        Monday - Sunday
                      </p>
                      <p className="text-muted-foreground">9:00 AM - 10:00 PM IST</p>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="flex items-start gap-4">
                    <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground mb-2">Customer Support</p>
                      <p className="text-muted-foreground">Open on Sunday</p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* About Us Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 pt-16 border-t border-border"
            >
              <h2 className="text-3xl font-bold mb-6 text-foreground">About Us</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Vikash Telecom is your trusted destination for premium mobile phones, 
                    accessories, and smart devices. We pride ourselves on offering the latest 
                    technology at competitive prices with exceptional customer service.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Located in the heart of Rajkot, our store provides a comprehensive selection 
                    of branded products with expert guidance and support.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
                    <h3 className="font-semibold text-foreground mb-3">Why Choose Us?</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Authentic Products
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Competitive Pricing
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Expert Customer Support
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Warranty & After Sales Service
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 border-y border-border py-12 md:py-16"
        >
          <div className="container-main text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Have Questions?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Don't hesitate to reach out. Our team is ready to assist you with any inquiries.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <a
                href="mailto:vikastelecomnew2026@gmail.com"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Send Email
              </a>
              <a
                href="tel:9327511512"
                className="px-8 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-semibold"
              >
                Call Us
              </a>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
