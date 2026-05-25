// High-Fidelity Local Dry Run Service
// Allows 100% functional local testing, layout verification, and spacing review with zero Google API keys required!

export const DEFAULT_PROMPT = `You are an expert Challenge-Based Learning (CBL) evaluator and specialist in India's Sustainable Development Goals (SDGs). 
Your task is to analyze project ideas submitted by students and provide a detailed, structured evaluation.`;

// Mock API key validation - always succeeds to enable seamless dry-run testing
export const validateApiKey = async (apiKey) => {
  // Simulate network latency beautifully
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

// Mock model list fetcher - returns a rich, detailed set of models including next-gen engines
export const fetchModels = async (apiKey) => {
  // Simulate network latency beautifully
  await new Promise(resolve => setTimeout(resolve, 300));
  return [
    { 
      value: 'gemini-1.5-flash', 
      label: 'Gemini 1.5 Flash (Fast)', 
      description: 'High-speed execution optimized for rapid student feedback.' 
    },
    { 
      value: 'gemini-1.5-pro', 
      label: 'Gemini 1.5 Pro (Powerful)', 
      description: 'Advanced reasoning capability ideal for complex, multi-layered challenges.' 
    },
    { 
      value: 'gemini-2.0-flash', 
      label: 'Gemini 2.0 Flash (Ultra-Next)', 
      description: 'Next-generation multimodal model with top-tier efficiency.' 
    }
  ];
};

// Mock project idea evaluator - generates ultra-realistic CBL & SDG evaluations programmatically
export const evaluateIdea = async (apiKey, modelName, systemPrompt, projectIdea) => {
  // Simulate deep AI content generation latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Premium mock project outcomes matching standard student challenges
  const mockPool = [
    {
      scores: { feasibility: 85, impact: 92, cbl_alignment: 88, sdg_alignment: 95 },
      overall_score: 90,
      evaluation: `### Key Strengths
- **Highly Relevant Essential Question**: The proposal directly targets local cafeteria organic waste, turning a massive operational challenge into active organic compost.
- **Strong Student Ownership**: Students take direct charge of building the wooden soil structures and auditing compost moisture profiles.

### Areas for Growth
- **Technological Scaling**: Consider integrating a simple digital scale to log food scrap weights and construct a classroom dashboard.
- **Holiday Maintenance**: Establish a roster for caretakers to turn the compost heaps during summer breaks so the system remains active.`,
      sdg_goals: ["SDG 11: Sustainable Cities & Communities", "SDG 12: Responsible Consumption & Production", "SDG 13: Climate Action"],
      recommendations: {
        short_term: [
          "Organize a core student 'Green Team' to run daily scrap collection logistics.",
          "Conduct a 3-day baseline audit of cafeteria waste weights.",
          "Construct 2 simple passive aeration composting beds near the school garden."
        ],
        long_term: [
          "Partner with local agricultural markets to distribute high-nutrient organic compost.",
          "Assemble an automated hydration sensor kit using accessible Arduino components.",
          "Scale the waste dashboard to include all school campuses across the district."
        ]
      }
    },
    {
      scores: { feasibility: 78, impact: 89, cbl_alignment: 82, sdg_alignment: 91 },
      overall_score: 85,
      evaluation: `### Key Strengths
- **Innovative Engineering**: Integrates solar-powered sensors with dynamic soil irrigation to reduce water waste.
- **Low Production Costs**: Relies on off-the-shelf microcontrollers and solar panels, keeping feasibility high.

### Areas for Growth
- **Community Outreach**: Farmers will need a clear, physical troubleshooting guide to trust digital sensor readouts.
- **Weather Resilience**: Formulate a secondary water catchment system (like gravity rainwater storage) to manage long drought periods.`,
      sdg_goals: ["SDG 6: Clean Water & Sanitation", "SDG 7: Affordable & Clean Energy", "SDG 15: Life on Land"],
      recommendations: {
        short_term: [
          "Construct a simple single-pot microcontroller prototype in a school lab.",
          "Draft a pocket-sized bilingual troubleshooting card for sensor operations.",
          "Connect a passive 50-liter rainwater barrel to feed the irrigation pump."
        ],
        long_term: [
          "Deploy solar-powered sensor nodes across 5 target small-holder agricultural plots.",
          "Integrate an automated GSM messaging node to text water status to farmers.",
          "Establish an energy-sharing cooperative grid to share surplus solar energy."
        ]
      }
    },
    {
      scores: { feasibility: 94, impact: 87, cbl_alignment: 90, sdg_alignment: 88 },
      overall_score: 90,
      evaluation: `### Key Strengths
- **Excellent Feasibility**: High-impact outreach utilizing student mentors and donated books with zero financial overhead.
- **Immediate Local Impact**: Directly addresses standard reading gaps in under-resourced community learning centers.

### Areas for Growth
- **Volunteer Consistency**: Establish a certificate or micro-credential pathway to keep student tutors motivated.
- **Curricular Alignment**: Deliver a structured 2-hour phonics workshop for mentors before outreach operations launch.`,
      sdg_goals: ["SDG 4: Quality Education", "SDG 5: Gender Equality", "SDG 10: Reduced Inequalities"],
      recommendations: {
        short_term: [
          "Run a school-wide book drive to classify donations by beginner and intermediate reading levels.",
          "Deliver the first 2-hour literacy mentoring workshop for student tutors.",
          "Partner with local primary centers to secure weekly 1-hour reading slots."
        ],
        long_term: [
          "Construct a mobile library cart to reach distant, rural residential colonies.",
          "Load open-source educational reading apps onto low-cost offline tablets.",
          "Establish an annual 'Youth Literary Festival' to showcase reading achievements."
        ]
      }
    }
  ];

  // Intelligently route the evaluation based on user input keywords to keep the dry run realistic!
  let selected = mockPool[0];
  const text = projectIdea.toLowerCase();
  
  if (text.includes("water") || text.includes("irrigation") || text.includes("solar") || text.includes("farm") || text.includes("crop")) {
    selected = mockPool[1];
  } else if (text.includes("education") || text.includes("teach") || text.includes("read") || text.includes("literacy") || text.includes("school")) {
    selected = mockPool[2];
  } else {
    // Random selector for general inputs
    selected = mockPool[Math.floor(Math.random() * mockPool.length)];
  }

  // Inject minor random variance to scores (±4%) to simulate dynamic real-time AI calculations
  const offset = () => Math.floor(Math.random() * 9) - 4; // -4 to +4
  const cap = (val) => Math.min(100, Math.max(0, val));

  return {
    scores: {
      feasibility: cap(selected.scores.feasibility + offset()),
      impact: cap(selected.scores.impact + offset()),
      cbl_alignment: cap(selected.scores.cbl_alignment + offset()),
      sdg_alignment: cap(selected.scores.sdg_alignment + offset())
    },
    overall_score: cap(selected.overall_score + offset()),
    evaluation: selected.evaluation,
    sdg_goals: selected.sdg_goals,
    recommendations: selected.recommendations
  };
};
