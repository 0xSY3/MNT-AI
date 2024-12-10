import type { Express } from "express";
import { db } from "../db";
import { contracts } from "@db/schema";
import OpenAI from "openai";
import { ethers } from 'ethers';

export function registerRoutes(app: Express) {
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
${features.map(f => `- ${f}`).join('\n')}

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
        model: "gpt-4o",
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
        temperature: 0.2, // Lower temperature for more consistent output
        max_tokens: 3000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      let generatedCode = completion.choices[0].message.content || '';

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
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: "Analyze this smart contract:\n\n" + code
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
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

      // Initialize OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get the contract code from Mantle network
      const provider = new ethers.JsonRpcProvider('https://rpc.mantle.xyz');
      
      // Get contract code
      const contractCode = await provider.getCode(address);
      
      if (contractCode === '0x') {
        return res.status(404).json({
          error: "No contract found at this address"
        });
      }

      // Create a system prompt for contract analysis
      const systemPrompt = `You are an expert smart contract analyzer. Analyze the given smart contract code and provide:
1. A brief, human-readable summary of what the contract does
2. Key features and functionality
3. Any potential security considerations

Format the response as a JSON object with these keys:
- summary: A concise explanation of the contract's purpose
- features: An array of key features and functions`;

      // Get AI analysis of the contract
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Using the latest GPT-4 model
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
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("No analysis content received from OpenAI");
      }
      const analysis = JSON.parse(content);

      res.json({
        contractCode,
        summary: analysis.summary,
        features: analysis.features
      });

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

      const systemPrompt = `You are an expert Mantle blockchain developer assistant specializing in L2 optimization and security analysis. Your role is to:

1. FUNCTIONALITY ANALYSIS:
   - Explain contract functionality in clear, non-technical terms
   - Identify key features and their business impact
   - Highlight unique aspects of the implementation

2. MANTLE L2 OPTIMIZATION:
   - Suggest Mantle-specific optimizations for gas efficiency
   - Calculate potential gas savings on Mantle vs other L2s
   - Recommend rollup-aware design patterns

3. INTERACTION GUIDANCE:
   - Provide step-by-step function interaction examples
   - Explain parameter requirements with validation rules
   - Share best practices for transaction handling

4. SECURITY INSIGHTS:
   - Identify potential vulnerabilities and risks
   - Suggest security improvements
   - Explain impact on Mantle's L2 architecture

5. CODE QUALITY:
   - Recommend Mantle-optimized code patterns
   - Suggest improvements for better L2 compatibility
   - Highlight areas for optimization

Format responses with clear sections, code examples when relevant, and always include:
1. Main answer/explanation
2. Mantle-specific context
3. Practical examples or steps
4. Security/optimization tips

Use JSON metadata for function calls and gas estimates:
{
  "type": "function" | "analysis" | "security" | "optimization",
  "mantleContext": { "savings": string, "optimizations": string[] },
  "examples": string[],
  "securityImpact": string
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Contract Address: ${address}\nContract Code:\n${contractCode}\nABI:\n${JSON.stringify(contractABI)}\n\nUser Question: ${message}`
          }
        ],
        temperature: 0.3
      });

      const response = completion.choices[0].message.content;
      
      // Determine if the response contains code
      const type = response?.includes("```") ? "code" : "text";
      
      res.json({
        response: response?.replace(/```[a-z]*\n/g, "").replace(/```/g, "").trim(),
        type
      });

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
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: "Generate comprehensive tests for this smart contract:\n\n" + code
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
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