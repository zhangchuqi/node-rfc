import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/generate-mapping
 * Use Gemini AI to generate data mapping rules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceSchema, targetSchema, direction } = body;

    if (!sourceSchema || !targetSchema) {
      return NextResponse.json(
        { success: false, error: "Source and target schemas are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Parse JSON schemas
    let sourceObj, targetObj;
    try {
      sourceObj = JSON.parse(sourceSchema);
      targetObj = JSON.parse(targetSchema);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in source or target schema" },
        { status: 400 }
      );
    }

    // Create prompt for Gemini
    const prompt = `You are a data mapping expert. Given a source JSON structure and a target JSON structure, generate mapping rules.

Direction: ${direction === 'input' ? 'API Input → RFC Parameters' : 'RFC Output → API Response'}

Source JSON Structure:
\`\`\`json
${JSON.stringify(sourceObj, null, 2)}
\`\`\`

Target JSON Structure:
\`\`\`json
${JSON.stringify(targetObj, null, 2)}
\`\`\`

Generate mapping rules in the following JSON format:
\`\`\`json
{
  "mappingRules": [
    {
      "source": "path.to.source.field",
      "target": "TARGET_FIELD",
      "transform": "optional_transform_function"
    }
  ],
  "explanation": "Brief explanation of the mapping logic"
}
\`\`\`

Available transform functions:
- toUpperCase: Convert to uppercase
- toLowerCase: Convert to lowercase
- trim: Remove whitespace
- parseInt: Convert to integer
- parseFloat: Convert to decimal
- toString: Convert to string
- split(',').join(';'): String manipulation
- Custom JavaScript expressions

Rules:
1. Match fields by semantic meaning (e.g., "customerNumber" → "KUNNR")
2. Apply appropriate transforms (e.g., SAP fields often need uppercase)
3. Use dot notation for nested fields (e.g., "address.street")
4. For array fields, specify the array path and item properties

Return ONLY the JSON, no additional text.`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to call Gemini API" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { success: false, error: "No response from Gemini" },
        { status: 500 }
      );
    }

    // Extract JSON from markdown code blocks if present
    let jsonText = generatedText;
    const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Parse the generated mapping
    let mappingData;
    try {
      mappingData = JSON.parse(jsonText);
    } catch (e) {
      // Try to extract JSON if there's extra text
      const jsonStartMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonStartMatch) {
        mappingData = JSON.parse(jsonStartMatch[0]);
      } else {
        return NextResponse.json(
          { success: false, error: "Failed to parse Gemini response", rawResponse: generatedText },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      mappingRules: mappingData.mappingRules || [],
      explanation: mappingData.explanation || "",
    });
  } catch (error: any) {
    console.error("AI mapping generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate mapping",
      },
      { status: 500 }
    );
  }
}
