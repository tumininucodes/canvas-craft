import type { CanvasItem, CanvasConfig, TemplateItem } from '../types';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'Social' | 'Business' | 'Aesthetic';
  gradient: string; // CSS style gradient for template card thumbnail
  config: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  items: TemplateItem[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'instagram-vibes',
    name: 'Instagram Modern Poster',
    description: 'Vibrant violet event or promo layout',
    category: 'Social',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    config: {
      width: 600,
      height: 600,
      backgroundColor: 'linear-gradient(135deg, #1e1b4b, #311042)'
    },
    items: [
      // Decorative background shapes
      {
        type: 'shape',
        shapeType: 'circle',
        x: -50,
        y: -50,
        width: 300,
        height: 300,
        rotation: 0,
        opacity: 0.15,
        locked: false,
        name: 'Glow Circle Left',
        fill: '#8b5cf6',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 0
      },
      {
        type: 'shape',
        shapeType: 'circle',
        x: 400,
        y: 400,
        width: 250,
        height: 250,
        rotation: 0,
        opacity: 0.2,
        locked: false,
        name: 'Glow Circle Right',
        fill: '#ec4899',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 0
      },
      {
        type: 'shape',
        shapeType: 'rect',
        x: 80,
        y: 80,
        width: 440,
        height: 440,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Inner Border',
        fill: 'transparent',
        strokeColor: '#f43f5e',
        strokeWidth: 2,
        borderRadius: 8
      },
      // Heading
      {
        type: 'text',
        x: 100,
        y: 160,
        width: 400,
        height: 120,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Heading text',
        text: 'CRAFT THE\nFUTURE',
        fontSize: 48,
        fontFamily: 'Outfit',
        color: '#ffffff',
        fontWeight: '800',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.1
      },
      // Decorative horizontal divider line
      {
        type: 'shape',
        shapeType: 'rect',
        x: 250,
        y: 310,
        width: 100,
        height: 4,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Line Divider',
        fill: '#8b5cf6',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 2
      },
      // Subtitle
      {
        type: 'text',
        x: 100,
        y: 340,
        width: 400,
        height: 60,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Sub-heading text',
        text: 'CanvasCraft Studio Design',
        fontSize: 18,
        fontFamily: 'Montserrat',
        color: '#e2e8f0',
        fontWeight: '500',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.2
      },
      // CTA or Extra detail
      {
        type: 'shape',
        shapeType: 'rect',
        x: 200,
        y: 420,
        width: 200,
        height: 40,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Button background',
        fill: '#ec4899',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 20
      },
      {
        type: 'text',
        x: 200,
        y: 428,
        width: 200,
        height: 30,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Button Text',
        text: 'LAUNCH NOW',
        fontSize: 13,
        fontFamily: 'Inter',
        color: '#ffffff',
        fontWeight: '700',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.2
      }
    ]
  },
  {
    id: 'linkedin-banner',
    name: 'LinkedIn Professional Banner',
    description: 'Sleek dark-blue business layout',
    category: 'Business',
    gradient: 'linear-gradient(135deg, #1e293b, #0f172a)',
    config: {
      width: 800,
      height: 350,
      backgroundColor: '#0b0f19'
    },
    items: [
      // Left bar accent
      {
        type: 'shape',
        shapeType: 'rect',
        x: 0,
        y: 0,
        width: 20,
        height: 350,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Accent Left',
        fill: '#3b82f6',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 0
      },
      // Decorative diagonal rectangle
      {
        type: 'shape',
        shapeType: 'rect',
        x: 550,
        y: -100,
        width: 300,
        height: 500,
        rotation: 25,
        opacity: 0.1,
        locked: false,
        name: 'Accent Slope',
        fill: '#3b82f6',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 16
      },
      // Small decoration grids
      {
        type: 'shape',
        shapeType: 'circle',
        x: 700,
        y: 50,
        width: 30,
        height: 30,
        rotation: 0,
        opacity: 0.4,
        locked: false,
        name: 'Circle Deco 1',
        fill: 'transparent',
        strokeColor: '#3b82f6',
        strokeWidth: 4,
        borderRadius: 0
      },
      {
        type: 'shape',
        shapeType: 'triangle',
        x: 650,
        y: 220,
        width: 40,
        height: 40,
        rotation: 45,
        opacity: 0.3,
        locked: false,
        name: 'Triangle Deco',
        fill: '#6366f1',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 0
      },
      // Name
      {
        type: 'text',
        x: 60,
        y: 90,
        width: 500,
        height: 50,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Full Name',
        text: 'ALEXANDER DRAFT',
        fontSize: 36,
        fontFamily: 'Outfit',
        color: '#ffffff',
        fontWeight: '700',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'left',
        lineHeight: 1.2
      },
      // Professional Title
      {
        type: 'text',
        x: 60,
        y: 145,
        width: 500,
        height: 30,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Job Title',
        text: 'Lead User Interface Designer & Developer',
        fontSize: 18,
        fontFamily: 'Inter',
        color: '#60a5fa',
        fontWeight: '400',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'left',
        lineHeight: 1.2
      },
      // Core details / tagline
      {
        type: 'text',
        x: 60,
        y: 200,
        width: 500,
        height: 60,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Tagline',
        text: 'Building high-performance design systems and modern web experiences with Svelte and Tailwind.',
        fontSize: 14,
        fontFamily: 'Montserrat',
        color: '#94a3b8',
        fontWeight: '300',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'left',
        lineHeight: 1.5
      },
      // Contact badge background
      {
        type: 'shape',
        shapeType: 'rect',
        x: 60,
        y: 270,
        width: 180,
        height: 28,
        rotation: 0,
        opacity: 0.15,
        locked: false,
        name: 'Contact Badge',
        fill: '#3b82f6',
        strokeColor: '#3b82f6',
        strokeWidth: 1,
        borderRadius: 4
      },
      {
        type: 'text',
        x: 60,
        y: 275,
        width: 180,
        height: 20,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Contact Text',
        text: 'www.canvascraft.dev',
        fontSize: 12,
        fontFamily: 'Inter',
        color: '#3b82f6',
        fontWeight: '600',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.2
      }
    ]
  },
  {
    id: 'quote-poster',
    name: 'Aesthetic Minimalist Quote',
    description: 'Serene warm poster with elegant serif text',
    category: 'Aesthetic',
    gradient: 'linear-gradient(135deg, #fef08a, #fed7aa)',
    config: {
      width: 450,
      height: 600,
      backgroundColor: '#fdfbf7'
    },
    items: [
      // Thin outer margin border
      {
        type: 'shape',
        shapeType: 'rect',
        x: 25,
        y: 25,
        width: 400,
        height: 550,
        rotation: 0,
        opacity: 0.8,
        locked: false,
        name: 'Thin border',
        fill: 'transparent',
        strokeColor: '#e7e5e4',
        strokeWidth: 1,
        borderRadius: 0
      },
      // Center star icon shape
      {
        type: 'shape',
        shapeType: 'star',
        x: 200,
        y: 110,
        width: 50,
        height: 50,
        rotation: 0,
        opacity: 0.8,
        locked: false,
        name: 'Decorative Star',
        fill: '#c2410c',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 0
      },
      // Elegant Quote Heading
      {
        type: 'text',
        x: 60,
        y: 200,
        width: 330,
        height: 150,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Main Quote',
        text: '“Simplicity is the ultimate sophistication.”',
        fontSize: 32,
        fontFamily: 'Playfair Display',
        color: '#1c1917',
        fontWeight: '400',
        fontStyle: 'italic',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.3
      },
      // Small line separator
      {
        type: 'shape',
        shapeType: 'rect',
        x: 200,
        y: 380,
        width: 50,
        height: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Line Divider',
        fill: '#78716c',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: 0
      },
      // Author
      {
        type: 'text',
        x: 60,
        y: 410,
        width: 330,
        height: 30,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: 'Author Name',
        text: 'LEONARDO DA VINCI',
        fontSize: 12,
        fontFamily: 'Montserrat',
        color: '#78716c',
        fontWeight: '600',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.2
      },
      // Aesthetic stamp / footer handwriting text
      {
        type: 'text',
        x: 60,
        y: 500,
        width: 330,
        height: 40,
        rotation: -2,
        opacity: 0.8,
        locked: false,
        name: 'Handwritten footer',
        text: 'CanvasCraft Minimalist Collection 2026',
        fontSize: 16,
        fontFamily: 'Caveat',
        color: '#c2410c',
        fontWeight: '500',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.2
      }
    ]
  }
];
