import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

const SYSTEM_MESSAGE = `You are MNT AI, an AI assistant specialized in the Mantle Network ecosystem. You help users understand:

1. Mantle Network's Layer 2 scaling solution
2. Smart contract development on Mantle
3. Network features and capabilities
4. Performance metrics and statistics
5. Best practices for building on Mantle

Keep responses concise, technical but approachable, and always accurate. If uncertain, admit limitations.`;

const CONTRACT_SYSTEM_MESSAGE = `You are a smart contract generation AI specialized in creating secure and optimized smart contracts specifically for the Mantle Network. Follow these strict guidelines:

1. Use Solidity ^0.8.0 or higher with specific Mantle Network optimizations:
   - Implement gas-efficient patterns suitable for Mantle's L2 architecture
   - Use Mantle's native token (MNT) integration where appropriate
   - Optimize for Mantle's block gas limit and transaction throughput

2. Security and Standards:
   - Follow Mantle Network's security best practices
   - Implement all security features directly in the contract without using imports
   - Use safe math operations (built into Solidity ^0.8.0)
   - Include reentrancy guards implemented directly in the contract
   - Emit events for all important state changes

3. Mantle-Specific Features:
   - Utilize Mantle's cross-chain messaging if bridging is needed
   - Implement efficient storage patterns for Mantle's data availability layer
   - Use Mantle's precompiled contracts when applicable
   - Consider Mantle's block finality time in time-sensitive operations

4. Code Structure:
   - Include comprehensive NatSpec documentation
   - Add detailed inline comments explaining Mantle-specific optimizations
   - Implement proper error handling with custom error messages
   - Use modular design patterns for better upgradability
   - Include events for off-chain tracking
   - DO NOT USE ANY IMPORTS - implement all required functionality directly in the contract

5. Gas Optimization:
   - Pack storage variables efficiently
   - Use bytes32 instead of string where possible
   - Implement batch operations where beneficial
   - Cache frequently accessed storage variables in memory
   - Use unchecked blocks for safe arithmetic operations

6. Testing Considerations:
   - Include test scenarios for Mantle-specific features
   - Consider edge cases related to L2 specifics
   - Add validation for cross-chain interactions

Generate production-ready code that leverages Mantle Network's unique capabilities while maintaining high security standards. All functionality must be implemented directly in the contract without using any external imports.`;

const CONTRACT_SUMMARY_MESSAGE = `You are a smart contract analyzer specialized in explaining Solidity contracts in a clear, human-readable format. For each contract analysis:

1. Provide a high-level overview of what the contract does
2. Explain the main features and functionality
3. Break down important functions and their purposes
4. Identify key state variables and their roles
5. Highlight any special mechanisms or patterns used
6. Note any external interactions or dependencies
7. Explain access control and permissions

Format your response in this structure:
{
  "overview": "Brief 1-2 sentence description of what the contract does",
  "purpose": "Detailed explanation of the contract's main purpose and use cases",
  "features": [
    {
      "name": "Feature name",
      "description": "Clear explanation of what this feature does"
    }
  ],
  "functions": [
    {
      "name": "Function name",
      "purpose": "What this function does",
      "access": "Who can call this function"
    }
  ],
  "stateVariables": [
    {
      "name": "Variable name",
      "purpose": "What this variable is used for"
    }
  ],
  "specialNotes": [
    "Any important notes about security, patterns, or special considerations"
  ]
}`;

const SECURITY_ANALYSIS_MESSAGE = `You are a smart contract security auditor specialized in analyzing Solidity contracts for the Mantle Network. For each analysis:

1. Check for common vulnerabilities (reentrancy, overflow/underflow, etc.)
2. Identify gas optimization opportunities specific to Mantle L2
3. Review access control mechanisms
4. Analyze external contract interactions and cross-chain calls
5. Check for proper event emissions
6. Verify state variable handling and storage optimization
7. Assess Mantle-specific security considerations

Provide your analysis in this exact JSON format:
{
  "overallRisk": "high|medium|low",
  "issues": [
    {
      "severity": "high|medium|low",
      "description": "Clear explanation of the issue",
      "line": "Line number if applicable (optional)",
      "snippet": "Relevant code snippet showing the issue",
      "impact": "Description of potential impact",
      "recommendation": "Specific recommendation to fix the issue"
    }
  ]
}

For each issue:
1. Include relevant code snippets that demonstrate the problem
2. Provide clear, actionable recommendations
3. Explain the potential impact of each issue
4. Reference specific lines of code where applicable
5. Consider Mantle L2-specific implications`;

const TEST_GENERATION_MESSAGE = `You are a smart contract test suite generator specialized in creating comprehensive tests for Solidity contracts on the Mantle Network. Generate tests that:

1. Cover all major contract functionality
2. Include unit tests for individual functions
3. Add integration tests for contract interactions
4. Implement security-focused test cases
5. Include gas optimization tests
6. Consider Mantle L2-specific scenarios

Format each test case in this structure:
{
  "name": "Test case name",
  "description": "What this test verifies",
  "code": "Complete test code",
  "type": "unit|integration|security|gas",
  "coverage": {
    "functions": ["Function names covered"],
    "lines": "Percentage of lines covered"
  },
  "expected": {
    "result": "Expected test outcome",
    "gasEstimate": "Estimated gas cost if applicable"
  }
}`;

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const reply = completion.choices[0].message.content;
    res.json({ message: reply });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

interface GenerateContractRequest {
  description: string;
  features?: string[];
  contractType?: string;
}

router.post('/generate', async (req, res) => {
  try {
    const { description, features, contractType } = req.body as GenerateContractRequest;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Generate a Solidity smart contract optimized for the Mantle Network with these requirements:

Description: ${description}

${features && features.length > 0 ? `Features:
${features.map((f: string) => `- ${f}`).join('\n')}` : ''}

${contractType ? `Contract Type: ${contractType}` : ''}

Requirements:
1. Optimize for Mantle Network's L2 architecture
2. Include gas-efficient patterns
3. Implement proper security measures
4. Use Mantle-specific features where appropriate
5. Add comprehensive documentation
6. DO NOT USE ANY IMPORTS - implement all required functionality directly in the contract

Please provide only the Solidity code without any additional explanation.
Include detailed comments explaining Mantle-specific optimizations and security considerations.
Remember: Do not use any import statements - all functionality must be implemented directly in the contract.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: CONTRACT_SYSTEM_MESSAGE },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 4000,
      presence_penalty: 0,
      frequency_penalty: 0
    });

    const code = completion.choices[0].message.content || '';
    const cleanedCode = code.replace(/```solidity|```/g, '').trim();
    
    res.json({ code: cleanedCode });
  } catch (error) {
    console.error('Contract Generation Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate contract' });
  }
});

router.post('/generate-tests', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Contract code is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Generate a comprehensive test suite for this Solidity smart contract:

${code}

Create tests that:
1. Cover all major contract functionality
2. Include unit tests for individual functions
3. Add integration tests for contract interactions
4. Implement security-focused test cases
5. Include gas optimization tests
6. Consider Mantle L2-specific scenarios

Return an array of test cases in the specified JSON format with name, description, code, type, coverage, and expected fields.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: TEST_GENERATION_MESSAGE },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 4000
    });

    const testsText = completion.choices[0].message.content || '';
    
    // Extract JSON from the response
    const jsonMatch = testsText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid test format received');
    }

    const tests = JSON.parse(jsonMatch[0]);
    
    res.json(tests);
  } catch (error) {
    console.error('Test Generation Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate tests' });
  }
});

router.post('/summarize', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Contract code is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Analyze this Solidity smart contract and provide a clear, human-readable summary:

${code}

Please explain:
1. What the contract does
2. Its main features and functionality
3. Important functions and their purposes
4. Key state variables
5. Any special mechanisms or patterns
6. External interactions
7. Access control and permissions

Return the analysis in the specified JSON format with overview, purpose, features, functions, stateVariables, and specialNotes.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: CONTRACT_SUMMARY_MESSAGE },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 3000
    });

    const summaryText = completion.choices[0].message.content || '';
    
    // Extract JSON from the response
    const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid summary format received');
    }

    const summary = JSON.parse(jsonMatch[0]);
    
    res.json(summary);
  } catch (error) {
    console.error('Contract Summary Error:', error);
    res.status(500).json({ error: 'Failed to generate contract summary' });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Contract code is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Perform a security analysis of this Solidity smart contract:

${code}

Analyze for:
1. Common vulnerabilities (reentrancy, overflow/underflow, etc.)
2. Gas optimization opportunities specific to Mantle L2
3. Access control mechanisms
4. External contract interactions
5. Event emissions
6. State variable handling
7. Mantle-specific security considerations

Return the analysis in the specified JSON format with overallRisk and issues array.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SECURITY_ANALYSIS_MESSAGE },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 3000
    });

    const analysisText = completion.choices[0].message.content || '';
    
    // Extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid analysis format received');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    res.json(analysis);
  } catch (error) {
    console.error('Security Analysis Error:', error);
    res.status(500).json({ error: 'Failed to perform security analysis' });
  }
});

// Helper function to calculate overall risk if not provided
function calculateOverallRisk(issues: any[]): string {
  if (issues.some(i => i.severity === 'high')) return 'high';
  if (issues.some(i => i.severity === 'medium')) return 'medium';
  if (issues.length > 0) return 'low';
  return 'safe';
}

export default router;
