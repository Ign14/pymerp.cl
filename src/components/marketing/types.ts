// Tipos para datos de la landing page

export interface Logo {
  name: string;
  imageUrl: string;
  alt: string;
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export interface Segment {
  id: string;
  type: 'service' | 'product';
  title: string;
  description: string;
  features: string[];
  icon: string;
  color: string;
}

export interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

