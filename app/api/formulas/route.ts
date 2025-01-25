import { NextResponse } from "next/server";
import OpenAI from "openai";

interface Formula {
  id: string;
  name: string;
  category: string;
  latex: string;
  description: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// This simulates a database of formulas
// In production, this should come from a real database
const formulaDatabase: Record<string, Formula[]> = {
  algebra: [
    {
      id: "quad",
      name: "Quadratic Formula",
      latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      description: "Solves ax² + bx + c = 0",
      category: "Algebra"
    },
    {
      id: "factor",
      name: "Difference of Squares",
      latex: "a^2 - b^2 = (a+b)(a-b)",
      description: "Factoring special case",
      category: "Algebra"
    },
    {
      id: "cube",
      name: "Cube Formula",
      latex: "a^3 \\pm b^3 = (a \\pm b)(a^2 \\mp ab + b^2)",
      description: "Sum/difference of cubes",
      category: "Algebra"
    },
    {
      id: "binomial",
      name: "Binomial Expansion",
      latex: "(x + y)^n = \\sum_{k=0}^n \\binom{n}{k} x^{n-k} y^k",
      description: "Expansion of (x + y)^n",
      category: "Algebra"
    }
  ],
  geometry: [
    {
      id: "pyth",
      name: "Pythagorean Theorem",
      latex: "a^2 + b^2 = c^2",
      description: "Right triangle relationship",
      category: "Geometry"
    },
    {
      id: "area-circle",
      name: "Circle Area",
      latex: "A = \\pi r^2",
      description: "Area of a circle",
      category: "Geometry"
    },
    {
      id: "vol-sphere",
      name: "Sphere Volume",
      latex: "V = \\frac{4}{3}\\pi r^3",
      description: "Volume of a sphere",
      category: "Geometry"
    },
    {
      id: "area-triangle",
      name: "Triangle Area",
      latex: "A = \\frac{1}{2}bh",
      description: "Area with base and height",
      category: "Geometry"
    }
  ],
  trigonometry: [
    {
      id: "sin-cos",
      name: "Sine & Cosine",
      latex: "\\sin^2 \\theta + \\cos^2 \\theta = 1",
      description: "Fundamental identity",
      category: "Trigonometry"
    },
    {
      id: "tan-def",
      name: "Tangent Definition",
      latex: "\\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta}",
      description: "Tangent in terms of sine/cosine",
      category: "Trigonometry"
    },
    {
      id: "sin-law",
      name: "Law of Sines",
      latex: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}",
      description: "Relates sides to angles",
      category: "Trigonometry"
    }
  ],
  calculus: [
    {
      id: "deriv-power",
      name: "Power Rule",
      latex: "\\frac{d}{dx}x^n = nx^{n-1}",
      description: "Derivative of power function",
      category: "Calculus"
    },
    {
      id: "deriv-exp",
      name: "Exponential Rule",
      latex: "\\frac{d}{dx}e^x = e^x",
      description: "Derivative of e^x",
      category: "Calculus"
    },
    {
      id: "deriv-ln",
      name: "Natural Log Rule",
      latex: "\\frac{d}{dx}\\ln(x) = \\frac{1}{x}",
      description: "Derivative of ln(x)",
      category: "Calculus"
    }
  ],
  physics: [
    {
      id: "kinetic",
      name: "Kinetic Energy",
      latex: "E_k = \\frac{1}{2}mv^2",
      description: "Energy of motion",
      category: "Physics"
    },
    {
      id: "grav-force",
      name: "Gravitational Force",
      latex: "F = G\\frac{m_1m_2}{r^2}",
      description: "Newton's law of gravitation",
      category: "Physics"
    },
    {
      id: "einstein",
      name: "Mass-Energy Equivalence",
      latex: "E = mc^2",
      description: "Einstein's famous equation",
      category: "Physics"
    }
  ],
  statistics: [
    {
      id: "mean",
      name: "Arithmetic Mean",
      latex: "\\bar{x} = \\frac{1}{n}\\sum_{i=1}^n x_i",
      description: "Average of values",
      category: "Statistics"
    },
    {
      id: "variance",
      name: "Variance",
      latex: "\\sigma^2 = \\frac{1}{n}\\sum_{i=1}^n (x_i - \\bar{x})^2",
      description: "Measure of spread",
      category: "Statistics"
    },
    {
      id: "normal-dist",
      name: "Normal Distribution",
      latex: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
      description: "Bell curve formula",
      category: "Statistics"
    }
  ],
  chemistry: [
    {
      id: "ideal-gas",
      name: "Ideal Gas Law",
      latex: "PV = nRT",
      description: "Relationship between pressure, volume, and temperature",
      category: "Chemistry"
    },
    {
      id: "ph",
      name: "pH Definition",
      latex: "pH = -\\log_{10}[H^+]",
      description: "Measure of acidity",
      category: "Chemistry"
    },
    {
      id: "gibbs",
      name: "Gibbs Free Energy",
      latex: "\\Delta G = \\Delta H - T\\Delta S",
      description: "Spontaneity of chemical reactions",
      category: "Chemistry"
    }
  ],
  quantum: [
    {
      id: "schrodinger",
      name: "Schrödinger Equation",
      latex: "i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi",
      description: "Quantum state evolution",
      category: "Quantum"
    },
    {
      id: "heisenberg",
      name: "Heisenberg Uncertainty",
      latex: "\\Delta x\\Delta p \\geq \\frac{\\hbar}{2}",
      description: "Position-momentum uncertainty",
      category: "Quantum"
    },
    {
      id: "debroglie",
      name: "de Broglie Wavelength",
      latex: "\\lambda = \\frac{h}{p}",
      description: "Wave-particle duality",
      category: "Quantum"
    }
  ]
};

function cleanLatex(latex: string): string {
  return latex
    // Remove display math delimiters
    .replace(/\\\[|\\\]/g, '')
    // Remove inline math delimiters
    .replace(/\\\(|\\\)/g, '')
    // Remove any leading/trailing whitespace
    .trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query")?.toLowerCase();

    let formulas: Formula[] = [];

    // If category is specified, return formulas from that category
    if (category && category in formulaDatabase) {
      formulas = formulaDatabase[category];
    } else {
      // Otherwise, return all formulas
      formulas = Object.values(formulaDatabase).flat();
    }

    // If search query is provided, filter formulas
    if (query) {
      formulas = formulas.filter(formula =>
        formula.name.toLowerCase().includes(query) ||
        formula.description.toLowerCase().includes(query)
      );
    }

    // If no formulas found, try using OpenAI to generate a formula
    if (formulas.length === 0 && query) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a mathematical formula expert. Provide formulas in LaTeX format. Do not include \\[ \\] or \\( \\) delimiters. Just provide the raw LaTeX formula."
          },
          {
            role: "user",
            content: `Generate a mathematical formula for: ${query}. Return only the LaTeX formula without any explanation or delimiters.`
          }
        ],
        max_tokens: 150,
      });

      const generatedFormula = completion.choices[0]?.message?.content;
      if (generatedFormula) {
        // Clean up the LaTeX formula
        const cleanedLatex = cleanLatex(generatedFormula);
        
        // Generate a more descriptive name based on the query
        const name = query.split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        formulas = [{
          id: "generated",
          name: `Formula for ${name}`,
          latex: cleanedLatex,
          description: "AI-generated formula based on your query",
          category: "Generated"
        }];
      }
    }

    return NextResponse.json({ formulas });
  } catch (error) {
    console.error("Formula API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch formulas" },
      { status: 500 }
    );
  }
} 