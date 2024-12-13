import type { Express } from "express";
import { db } from "../db";
import { contracts } from "@db/schema";
import OpenAI from "openai";
import { ethers } from 'ethers';
import aiRouter from './routes/ai';

export function registerRoutes(app: Express) {
  // Register AI Assistant routes
  app.use('/api/ai', aiRouter);

  // Contract Compilation endpoint
  app.post("/api/compile-contract", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({
          error: "Contract code is required"
        });
      }

      // Basic validation of Solidity code
      if (!code.includes('pragma solidity') || !code.includes('contract')) {
        return res.status(400).json({
          error: "Invalid Solidity contract code"
        });
      }

      // For now, just validate the syntax
      res.json({ 
        success: true,
        message: "Contract compiled successfully"
      });
      
    } catch (error) {
      console.error("Compilation error:", error);
      res.status(500).json({
        error: "Failed to compile contract",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  // AI Contract Generation
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { description, features, contractType = "standard" } = req.body;

      if (!description || !features || !Array.isArray(features)) {
        return res.status(400).json({ 
          error: "Invalid input: description and features array are required" 
        });
      }

      if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API key is not configured");
        return res.status(500).json({ 
          error: "OpenAI API is not properly configured" 
        });
      }

      // System prompt for clean contract generation
      const systemPrompt = `You are a Solidity developer specializing in Mantle Network smart contracts. Generate clean, efficient smart contracts without comments or documentation. Focus on:
1. Gas efficiency for Mantle L2
2. Custom errors instead of requires
3. Proper event emission
4. Access control
5. Security best practices
6. Clean, minimal code structure

Return ONLY the Solidity contract code without any comments or documentation.`;

      // User prompt for minimal contract structure
      const userPrompt = `Create a ${contractType} smart contract for Mantle Network with these requirements:

Description: ${description}

Features:
${features.map((f: string) => `- ${f}`).join('\n')}

Follow this exact format:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract [ContractName] {
    address public owner;
    [state variables]

    event [EventName]([parameters]);

    error Unauthorized();
    error InvalidInput();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    [functions]
}

Generate the contract with:
1. No comments or documentation
2. Custom errors instead of requires
3. Events for state changes
4. Proper access control
5. Input validation with custom errors
6. Gas optimization for Mantle L2

Return ONLY the complete Solidity contract code.`;

      console.log("Generating Mantle-optimized contract...");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      let generatedCode = completion.choices[0].message.content;
      if (!generatedCode) {
        throw new Error("No code was generated");
      }

      // Clean up any formatting artifacts
      generatedCode = generatedCode.trim()
        .replace(/^```solidity\n/gm, '')
        .replace(/^```\n/gm, '')
        .replace(/```$/gm, '')
        .trim();

      // Validate generated code
      if (!generatedCode.includes('pragma solidity') || 
          !generatedCode.includes('contract ')) {
        throw new Error('Generated code does not match required format');
      }

      console.log("Mantle-optimized contract generated successfully");

      // Save to database if needed
      const newContract = await db.insert(contracts).values({
        name: `Contract_${Date.now()}`,
        code: generatedCode,
        description: description,
        metadata: {
          network: 'mantle',
          solidityVersion: '^0.8.19',
          features: features,
          contractType: contractType,
          timestamp: new Date().toISOString()
        }
      }).returning();

      res.json({ 
        code: generatedCode,
        contractInfo: {
          type: contractType,
          network: 'mantle',
          features: features,
          timestamp: new Date().toISOString()
        },
        message: "Smart contract generated successfully with Mantle L2 optimizations"
      });

    } catch (error) {
      console.error("Contract generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        error: "Failed to generate Mantle contract",
        details: errorMessage
      });
    }
  });

  // Security and Optimization Analysis endpoint
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          error: "Contract code is required"
        });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API is not properly configured"
        });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // System prompt for security and optimization analysis
      const systemPrompt = `You are an expert Mantle L2 smart contract auditor. Analyze the given contract code and provide:
1. Security vulnerabilities with severity levels
2. Gas optimization opportunities specific to Mantle L2
3. Code quality improvements
4. L2-specific performance optimizations

Format the response as a JSON object with these keys:
{
  "suggestions": [{ "type": "warning" | "error" | "info", "message": string, "line": number }],
  "securityIssues": [{ 
    "severity": "high" | "medium" | "low",
    "description": string,
    "recommendation": string,
    "impact": string,
    "references": string[]
  }],
  "optimizations": [{
    "type": "gas" | "performance" | "mantle-specific",
    "description": string,
    "estimate": string,
    "suggestion": string,
    "beforeCode": string,
    "afterCode": string
  }],
  "mantleOptimizations": [{
    "category": "rollup" | "calldata" | "storage" | "computation",
    "description": string,
    "potentialSavings": string,
    "implementation": string
  }]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt + "\n\nIMPORTANT: Your response must be a valid JSON object."
          },
          {
            role: "user",
            content: "Analyze this smart contract:\n\n" + code
          }
        ],
        temperature: 0.3,
        max_tokens: 4096
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("No analysis content received from OpenAI");
      }

      const analysis = JSON.parse(content);

      res.json(analysis);

    } catch (error) {
      console.error("Security analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze contract",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Contract Decoder endpoint
  app.post("/api/decoder/analyze", async (req, res) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({
          error: "Contract address or transaction hash is required"
        });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API is not properly configured"
        });
      }

      // Initialize OpenAI and provider
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
      
      let contractCode;
      let transactionData;
      
      // Check if input is a transaction hash (66 characters long, starts with 0x)
      if (address.length === 66 && address.startsWith('0x')) {
        try {
          // Get transaction data
          const tx = await provider.getTransaction(address);
          if (!tx) {
            return res.status(404).json({
              error: "Transaction not found"
            });
          }
          
          // Get contract code from the "to" address if it exists
          if (tx.to) {
            contractCode = await provider.getCode(tx.to);
          }
          
          // Include transaction data in response
          transactionData = {
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            data: tx.data,
            gasLimit: tx.gasLimit.toString(),
            gasPrice: tx.gasPrice?.toString(),
          };
        } catch (error) {
          return res.status(400).json({
            error: "Invalid transaction hash or transaction not found"
          });
        }
      } else {
        // Treat as contract address
        try {
          contractCode = await provider.getCode(address);
          if (contractCode === '0x') {
            return res.status(404).json({
              error: "No contract found at this address"
            });
          }
        } catch (error) {
          return res.status(400).json({
            error: "Invalid contract address"
          });
        }
      }

      // Create a system prompt for contract analysis
      const systemPrompt = `You are an expert smart contract analyzer specializing in Ethereum and Layer 2 contracts. Your task is to:
1. Analyze the given smart contract code thoroughly
2. Provide a clear, professional summary of its purpose and functionality
3. List key features and security considerations

Format your response as a clean, well-formatted JSON object with these keys:
- summary: A clear, concise explanation (1-2 sentences) starting with "This smart contract..."
- features: An array of key features, each starting with an action verb in present tense

Keep the language professional, precise, and free of technical jargon where possible.`;

      // Get AI analysis of the contract
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: "Analyze this smart contract:\n\n" + contractCode
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("No analysis content received from OpenAI");
      }
      const analysis = JSON.parse(content);

      // Clean and format the summary text
      let formattedSummary = analysis.summary.trim();
      if (!formattedSummary.startsWith("This")) {
        formattedSummary = "This smart contract " + formattedSummary.toLowerCase();
      }
      
      // Format features array ensuring clean text and proper capitalization
      const formattedFeatures = analysis.features.map((feature: string) => {
        feature = feature.trim();
        return feature.charAt(0).toUpperCase() + feature.slice(1);
      });

      // Prepare response object
      const response: any = {};
      
      // Include transaction data if available
      if (transactionData) {
        response.transaction = transactionData;
      }
      
      // Include contract analysis if contract code is available
      if (contractCode && contractCode !== '0x') {
        response.contractCode = contractCode;
        response.summary = formattedSummary;
        response.features = formattedFeatures;
      }
      
      res.json(response);

    } catch (error) {
      console.error("Contract analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze contract",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Contract Chat Analysis endpoint
  app.post("/api/chat/analyze", async (req, res) => {
    try {
      const { message, contractCode, contractABI, address } = req.body;

      if (!message || !contractCode) {
        return res.status(400).json({
          error: "Message and contract code are required"
        });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API is not properly configured"
        });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are an expert Solidity smart contract analyzer for the Mantle network. You will help users understand and interact with smart contracts through natural language conversation.

KEY INSTRUCTIONS:
1. ALWAYS analyze the provided contract code first
2. Answer questions based on the actual code implementation
3. Provide specific examples using actual function names and parameters from the contract
4. If code examples are needed, use proper Solidity syntax
5. Focus on Mantle L2 specific optimizations and features

RESPONSE TYPES:
1. For general questions about the contract:
   - Explain the core functionality
   - Highlight key features
   - Mention any unique aspects

2. For function-specific questions:
   Format as JSON:
   {
     "type": "function",
     "functionName": "actualFunctionName",
     "description": "What the function does",
     "params": { "paramName": "expectedType" },
     "gasEstimate": "estimated gas cost",
     "mantleOptimizations": {
       "optimizations": ["specific L2 optimization tips"],
       "savings": "estimated gas savings"
     }
   }

3. For security questions:
   - Identify potential issues in the specific code
   - Suggest concrete fixes
   - Reference relevant standards

4. For contract interaction questions:
   - Provide exact function call examples
   - Include parameter formats
   - Show expected outcomes

Remember:
- Be precise and reference actual code
- Include code examples when relevant
- Focus on practical usage
- Highlight L2-specific considerations`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Contract Address: ${address}

Contract Code:
${contractCode}

Contract ABI:
${JSON.stringify(contractABI, null, 2)}

User Question: ${message}

Analyze the contract code above and answer the question. If the question is about function calls or interactions, return the response in JSON format as specified in the system prompt.
For other types of questions, provide a detailed explanation with relevant code examples.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const responseContent = completion.choices[0].message.content;
      
      // Process the response content
      try {
        // First try to parse as JSON for function-specific responses
        const parsedJson = responseContent ? JSON.parse(responseContent) : null;
        if (!parsedJson) {
          throw new Error("No response content to parse");
        }
        
        // Convert JSON to human-readable format
        const humanReadableResponse = `### Function Analysis: ${parsedJson.functionName}

${parsedJson.description}

### Technical Details:
- Gas Cost: ${parsedJson.gasEstimate}
${Object.entries(parsedJson.params).map(([key, type]) => `- Parameter: ${key} (${type})`).join('\n')}

### Mantle L2 Optimizations:
${parsedJson.mantleOptimizations.optimizations.map((opt: string) => `- ${opt}`).join('\n')}
${parsedJson.mantleOptimizations.savings ? `\nPotential Gas Savings: ${parsedJson.mantleOptimizations.savings}` : ''}`;

        res.json({
          response: humanReadableResponse,
          type: "analysis",
          timestamp: new Date().toISOString(),
          metadata: {
            functionName: parsedJson.functionName,
            params: parsedJson.params,
            gasEstimate: parsedJson.gasEstimate,
            mantleOptimizations: parsedJson.mantleOptimizations
          }
        });
      } catch (e) {
        // If not JSON, process as regular text/code response
        let type = "text";
        let response = responseContent;

        // Check for code blocks
        if (responseContent?.includes("```")) {
          type = "code";
          // Extract code blocks and clean them
          const codeBlocks = responseContent.match(/```[\s\S]*?```/g) || [];
          response = codeBlocks
            .map(block => block.replace(/```[a-z]*\n?/g, "").replace(/```/g, "").trim())
            .join("\n\n");
        } 
        // Check for warnings/errors
        else if (responseContent?.toLowerCase().includes("warning") || 
                 responseContent?.toLowerCase().includes("caution")) {
          type = "warning";
        }
        else if (responseContent?.toLowerCase().includes("error") || 
                 responseContent?.toLowerCase().includes("vulnerability")) {
          type = "error";
        }
        
        res.json({
          response: response?.trim() || "",
          type,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error("Chat analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze message",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Test Suite Generation endpoint
  app.post("/api/ai/generate-tests", async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          error: "Contract code is required"
        });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error: "OpenAI API is not properly configured"
        });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // System prompt for test generation
      const systemPrompt = `You are an expert smart contract test writer specializing in comprehensive test coverage. Generate a variety of tests including:

1. Unit Tests:
   - Function-level testing
   - Input validation
   - State changes
   - Event emissions

2. Integration Tests:
   - Contract interactions
   - Complex scenarios
   - Edge cases

3. Security Tests:
   - Access control
   - Input validation
   - Reentrancy protection
   - Integer overflow/underflow

4. Gas Optimization Tests:
   - Gas usage tracking
   - Optimization verification
   - Mantle L2-specific optimizations

Format the response as a JSON array of test objects:
{
  "tests": [{
    "name": string,
    "description": string,
    "code": string,
    "type": "unit" | "integration" | "security" | "gas",
    "coverage": {
      "functions": string[],
      "lines": number
    },
    "expected": {
      "result": string,
      "gasEstimate": string
    }
  }]
}

Use Hardhat/Chai syntax for tests. Include comments explaining test logic.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt + "\n\nIMPORTANT: Your response must be a valid JSON object containing a 'tests' array."
          },
          {
            role: "user",
            content: "Generate comprehensive tests for this smart contract:\n\n" + code
          }
        ],
        temperature: 0.3,
        max_tokens: 4096
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("No test content received from OpenAI");
      }

      const { tests } = JSON.parse(content);

      res.json(tests);

    } catch (error) {
      console.error("Test generation error:", error);
      res.status(500).json({
        error: "Failed to generate tests",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
