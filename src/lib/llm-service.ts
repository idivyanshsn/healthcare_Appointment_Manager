import { PreVisitSummary, PostVisitSummary, UrgencyLevel, MedicationScheduleItem } from '../types';

export const llmService = {
  async generatePreVisitSummary(symptoms: string): Promise<PreVisitSummary> {
    const rawPrompt = `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptoms}`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${rawPrompt}\n\nRespond strictly in valid JSON with this exact schema:\n{\n  "urgencyLevel": "Low" | "Medium" | "High",\n  "chiefComplaint": "string",\n  "suggestedQuestions": ["question 1", "question 2", "question 3"]\n}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return {
              urgencyLevel: normalizeUrgency(parsed.urgencyLevel),
              chiefComplaint: parsed.chiefComplaint || symptoms.slice(0, 120),
              suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
                ? parsed.suggestedQuestions.slice(0, 3)
                : getFallbackQuestions(symptoms),
              analyzedAt: new Date().toISOString(),
              symptomsRaw: symptoms,
            };
          }
        }
      } catch (err) {
        console.warn('[LLM Service] Gemini API call failed, switching to clinical fallback:', err);
      }
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an expert clinical triage assistant. Always return valid JSON.',
              },
              {
                role: 'user',
                content: `${rawPrompt}\n\nReturn JSON: { "urgencyLevel": "Low"|"Medium"|"High", "chiefComplaint": "string", "suggestedQuestions": ["q1", "q2", "q3"] }`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          return {
            urgencyLevel: normalizeUrgency(parsed.urgencyLevel),
            chiefComplaint: parsed.chiefComplaint || symptoms.slice(0, 120),
            suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
              ? parsed.suggestedQuestions.slice(0, 3)
              : getFallbackQuestions(symptoms),
            analyzedAt: new Date().toISOString(),
            symptomsRaw: symptoms,
          };
        }
      } catch (err) {
        console.warn('[LLM Service] OpenAI API call failed, switching to clinical fallback:', err);
      }
    }

    return generateDeterministicPreVisitSummary(symptoms);
  },

  async generatePostVisitSummary(notes: string, rawPrescriptions?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>): Promise<PostVisitSummary> {
    const rawPrompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${notes}`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${rawPrompt}\n\nRespond strictly in valid JSON with this exact schema:\n{\n  "clinicalDiagnosis": "string",\n  "patientFriendlyExplanation": "clear, empathetic explanation in simple language",\n  "medicationSchedule": [\n    {\n      "medicineName": "string",\n      "dosage": "string",\n      "frequency": "string",\n      "durationDays": number,\n      "instructions": "string",\n      "scheduledTimes": ["08:00 AM", "08:00 PM"]\n    }\n  ],\n  "followUpSteps": ["step 1", "step 2"],\n  "warningSigns": ["red flag symptom 1", "red flag symptom 2"],\n  "nextVisitRecommendation": "string"\n}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return {
              clinicalDiagnosis: parsed.clinicalDiagnosis || 'Clinical Assessment Complete',
              patientFriendlyExplanation: parsed.patientFriendlyExplanation || 'Your consultation notes have been summarized by your physician.',
              medicationSchedule: (parsed.medicationSchedule || []).map((m: any, idx: number) => ({
                id: `med_${Date.now()}_${idx}`,
                medicineName: m.medicineName || 'Prescribed Medication',
                dosage: m.dosage || 'As directed',
                frequency: m.frequency || 'Daily',
                durationDays: Number(m.durationDays) || 7,
                instructions: m.instructions || 'Take as advised by your doctor',
                scheduledTimes: Array.isArray(m.scheduledTimes) && m.scheduledTimes.length > 0
                  ? m.scheduledTimes
                  : computeScheduledTimes(m.frequency || 'daily'),
              })),
              followUpSteps: Array.isArray(parsed.followUpSteps)
                ? parsed.followUpSteps
                : ['Follow prescribed medication timing', 'Maintain adequate rest and hydration'],
              warningSigns: Array.isArray(parsed.warningSigns)
                ? parsed.warningSigns
                : ['Seek immediate emergency care if you experience severe shortness of breath, chest pain, or sudden confusion.'],
              nextVisitRecommendation: parsed.nextVisitRecommendation || 'Return for follow-up as recommended by your doctor.',
              generatedAt: new Date().toISOString(),
              doctorNotesRaw: notes,
            };
          }
        }
      } catch (err) {
        console.warn('[LLM Service] Gemini post-visit generation failed, using fallback:', err);
      }
    }

    return generateDeterministicPostVisitSummary(notes, rawPrescriptions);
  },
};

function normalizeUrgency(val: any): UrgencyLevel {
  if (!val || typeof val !== 'string') return 'Medium';
  const clean = val.trim().toLowerCase();
  if (clean.includes('high') || clean.includes('urgent') || clean.includes('severe')) return 'High';
  if (clean.includes('low') || clean.includes('mild') || clean.includes('routine')) return 'Low';
  return 'Medium';
}

export function computeScheduledTimes(frequency: string): string[] {
  const f = frequency.toLowerCase();
  if (f.includes('thrice') || f.includes('3 times') || f.includes('tid') || f.includes('three')) {
    return ['08:00 AM', '02:00 PM', '08:00 PM'];
  }
  if (f.includes('twice') || f.includes('2 times') || f.includes('bid') || f.includes('two')) {
    return ['08:00 AM', '08:00 PM'];
  }
  if (f.includes('four') || f.includes('4 times') || f.includes('qid')) {
    return ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM'];
  }
  if (f.includes('night') || f.includes('bedtime') || f.includes('qhs') || f.includes('evening')) {
    return ['09:00 PM'];
  }
  return ['08:00 AM'];
}

function getFallbackQuestions(symptoms: string): string[] {
  const s = symptoms.toLowerCase();
  if (s.includes('chest') || s.includes('heart') || s.includes('breath')) {
    return [
      'Do the symptoms worsen during physical activity or stress?',
      'Have you noticed any dizziness, palpitations, or swelling in your ankles?',
      'Is there any family history of cardiac or pulmonary conditions?',
    ];
  }
  if (s.includes('skin') || s.includes('rash') || s.includes('itch')) {
    return [
      'Have you been exposed to any new skincare products, detergents, or outdoors foliage?',
      'Has the rash spread or changed in color and texture over time?',
      'Are you experiencing any itching that disrupts sleep?',
    ];
  }
  if (s.includes('headache') || s.includes('migraine') || s.includes('dizzy')) {
    return [
      'How often do these headaches occur, and what is their typical duration?',
      'Are there specific triggers such as bright lights, screen time, or lack of sleep?',
      'Have over-the-counter painkillers provided adequate relief?',
    ];
  }
  return [
    'How long have these symptoms persisted and has the intensity increased?',
    'What medications or home remedies have you tried so far?',
    'Are there any associated symptoms like fever, fatigue, or localized pain?',
  ];
}

function generateDeterministicPreVisitSummary(symptoms: string): PreVisitSummary {
  const s = symptoms.toLowerCase();
  let urgencyLevel: UrgencyLevel = 'Low';
  const highKeywords = [
    'severe chest pain',
    'difficulty breathing',
    'shortness of breath',
    'blood in stool',
    'coughing blood',
    'paralysis',
    'sudden loss of vision',
    'high fever > 103',
    'unconscious',
    'crushing pressure',
    'fainting',
    'severe bleeding',
    'anaphylaxis',
    'stroke',
  ];
  const mediumKeywords = [
    'persistent fever',
    'chest tightness',
    'moderate pain',
    'vomiting',
    'ear pain',
    'spreading rash',
    'migraine',
    'joint swelling',
    'palpitations',
    'infection',
    'swollen lymph',
    'wheezing',
  ];

  if (highKeywords.some((kw) => s.includes(kw))) {
    urgencyLevel = 'High';
  } else if (mediumKeywords.some((kw) => s.includes(kw))) {
    urgencyLevel = 'Medium';
  } else if (s.length > 80 || s.includes('pain') || s.includes('fever') || s.includes('days')) {
    urgencyLevel = 'Medium';
  }

  let chiefComplaint = symptoms.trim();
  if (chiefComplaint.length > 150) {
    chiefComplaint = chiefComplaint.slice(0, 147) + '...';
  }
  chiefComplaint = chiefComplaint.charAt(0).toUpperCase() + chiefComplaint.slice(1);

  return {
    urgencyLevel,
    chiefComplaint,
    suggestedQuestions: getFallbackQuestions(symptoms),
    analyzedAt: new Date().toISOString(),
    symptomsRaw: symptoms,
  };
}

function generateDeterministicPostVisitSummary(
  notes: string,
  rawPrescriptions?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>
): PostVisitSummary {
  const n = notes.toLowerCase();
  let clinicalDiagnosis = 'General Clinical Evaluation & Treatment Plan';
  if (notes.includes('Dx:') || notes.includes('Diagnosis:')) {
    const match = notes.match(/(?:Dx|Diagnosis):\s*([^.\n]+)/i);
    if (match && match[1]) {
      clinicalDiagnosis = match[1].trim();
    }
  } else if (n.includes('hypertension')) {
    clinicalDiagnosis = 'Essential Hypertension (Stage 1)';
  } else if (n.includes('dermatitis') || n.includes('eczema')) {
    clinicalDiagnosis = 'Contact Dermatitis with Skin Barrier Sensitivity';
  } else if (n.includes('migraine')) {
    clinicalDiagnosis = 'Tension / Migraine Headache Spectrum';
  } else if (n.includes('pharyngitis') || n.includes('throat') || n.includes('cold')) {
    clinicalDiagnosis = 'Acute Viral Upper Respiratory Infection';
  }

  let patientFriendlyExplanation = `Based on your consultation, the doctor evaluated your condition as ${clinicalDiagnosis}. The recommended treatment protocol focuses on relieving current symptoms and supporting your recovery.`;
  if (n.includes('hypertension')) {
    patientFriendlyExplanation = 'Your blood pressure readings were slightly above normal targets. The doctor has prescribed blood pressure regulation therapy along with lifestyle recommendations.';
  } else if (n.includes('dermatitis') || n.includes('eczema')) {
    patientFriendlyExplanation = 'Your skin is experiencing localized irritation and inflammation (dermatitis). The prescribed topical regimen and oral anti-allergy medication will calm the redness, relieve itching, and restore the skin barrier.';
  } else if (n.includes('migraine')) {
    patientFriendlyExplanation = 'Your symptoms align with migraine headaches. The treatment plan aims to reduce acute episode severity and address common lifestyle triggers.';
  }

  const medicationSchedule: MedicationScheduleItem[] = [];

  if (rawPrescriptions && rawPrescriptions.length > 0) {
    rawPrescriptions.forEach((rx, idx) => {
      const days = parseInt(rx.duration, 10) || 7;
      medicationSchedule.push({
        id: `med_${Date.now()}_${idx}`,
        medicineName: rx.name || 'Prescription Medicine',
        dosage: rx.dosage || '1 dose',
        frequency: rx.frequency || 'Once daily',
        durationDays: days,
        instructions: rx.instructions || 'Take as advised with water',
        scheduledTimes: computeScheduledTimes(rx.frequency || 'once daily'),
      });
    });
  } else {
    if (n.includes('amoxicillin')) {
      medicationSchedule.push({
        id: `med_${Date.now()}_1`,
        medicineName: 'Amoxicillin 500mg',
        dosage: '1 capsule',
        frequency: 'Thrice daily with food',
        durationDays: 7,
        instructions: 'Complete the entire 7-day course even if you feel better.',
        scheduledTimes: ['08:00 AM', '02:00 PM', '08:00 PM'],
      });
    }
    if (n.includes('paracetamol') || n.includes('acetaminophen') || n.includes('tylenol')) {
      medicationSchedule.push({
        id: `med_${Date.now()}_2`,
        medicineName: 'Paracetamol 650mg',
        dosage: '1 tablet',
        frequency: 'Twice daily as needed',
        durationDays: 5,
        instructions: 'Take after meals for fever or pain. Do not exceed 3000mg per day.',
        scheduledTimes: ['08:00 AM', '08:00 PM'],
      });
    }
    if (medicationSchedule.length === 0) {
      medicationSchedule.push({
        id: `med_${Date.now()}_default`,
        medicineName: 'Prescribed Supportive Therapy',
        dosage: 'As indicated on packaging',
        frequency: 'Twice daily',
        durationDays: 7,
        instructions: 'Take consistently at scheduled hours with a full glass of water.',
        scheduledTimes: ['08:00 AM', '08:00 PM'],
      });
    }
  }

  const followUpSteps = [
    'Adhere strictly to the medication schedule and take doses at the designated times.',
    'Maintain adequate hydration (at least 2-2.5 liters of water daily) and get 7-8 hours of sleep.',
    'Keep a daily symptom log to track your response to treatment.',
    'Schedule a follow-up review if symptoms persist beyond the prescribed course duration.',
  ];

  const warningSigns = [
    'Severe sudden pain, high fever (> 101.5°F), or difficulty breathing.',
    'Signs of allergic reaction: facial swelling, hives, or rapid wheezing (call emergency services immediately).',
  ];

  return {
    clinicalDiagnosis,
    patientFriendlyExplanation,
    medicationSchedule,
    followUpSteps,
    warningSigns,
    nextVisitRecommendation: 'Follow up in 7 to 14 days if symptoms do not fully resolve.',
    generatedAt: new Date().toISOString(),
    doctorNotesRaw: notes,
  };
}
