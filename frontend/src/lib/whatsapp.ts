const WHATSAPP_BUSINESS_NUMBER = "919327511512";

export const buildProductWhatsAppLink = (productName: string) => {
  const safeName = productName?.trim() || "this product";
  const message = `Hi, I am interested in: ${safeName}`;
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const openProductWhatsApp = (productName: string) => {
  const url = buildProductWhatsAppLink(productName);
  window.open(url, "_blank", "noopener,noreferrer");
};
