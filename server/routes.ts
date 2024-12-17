import type { Express } from "express";
import { db } from "../db";
import { contracts } from "@db/schema";
import OpenAI from "openai";
import { ethers } from 'ethers';
import solc from 'solc';
import { CONTRACT_COMPILER_VERSION, COMPILER_SETTINGS } from './config/mantle';
import aiRouter from './routes/ai';
import contractRouter from './routes/contract';
import decoderRouter from './routes/decoder';

// Helper function to truncate large contract code
function truncateContractCode(code: string, maxLength: number = 8000): string {
  if (code.length <= maxLength) return code;
  const half = Math.floor(maxLength / 2);
  return code.slice(0, half) + '\n... [truncated] ...\n' + code.slice(-half);
}

// Helper function to clean and parse JSON from OpenAI response
function parseOpenAIResponse(content: string | null): any {
  if (!content) throw new Error("No content to parse");
  
  // Remove markdown code blocks if present
  content = content.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
  
  // Attempt to parse the cleaned content
  try {
    return JSON.parse(content);
  } catch (e) {
    // If parsing fails, try to extract JSON from the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse response as JSON");
  }
}

// Helper function to format contract analysis response
function formatContractAnalysis(analysis: any) {
  return {
    overview: {
      title: analysis.title || "Smart Contract Analysis",
      description: analysis.description || "No description available",
      purpose: analysis.purpose || "Purpose not specified",
      category: analysis.category || "General Smart Contract"
    },
    functionality: {
      mainFeatures: analysis.mainFeatures || [],
      keyFunctions: analysis.functions?.map((fn: any) => ({
        name: fn.name,
        description: fn.description,
        visibility: fn.visibility,
        parameters: fn.parameters,
        returns: fn.returns
      })) || [],
      events: analysis.events || [],
      modifiers: analysis.modifiers || []
    },
    technicalDetails: {
      version: analysis.version || "Not specified",
      interfaces: analysis.interfaces || [],
      inheritance: analysis.inheritance || [],
      stateVariables: analysis.stateVariables || [],
      accessControl: analysis.accessControl || []
    },
    security: {
      features: analysis.securityFeatures || [],
      considerations: analysis.securityConsiderations || []
    }
  };
}

export function registerRoutes(app: Express) {
  // Register routers
  app.use('/api/ai', aiRouter);
  app.use('/api/contract', contractRouter);
  app.use('/api/decoder', decoderRouter);

  // Contract Compilation endpoint
  app.post("/api/compile", async (req: any, res: any) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          error: "Contract code is required"
        });
      }

      // Create input object for solc
      const input = {
        language: 'Solidity',
        sources: {
          'contract.sol': {
            content: code
          }
        },
        settings: {
          ...COMPILER_SETTINGS,
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        }
      };

      // Load specific version of solc
      const solcInput = JSON.stringify(input);
      const output = JSON.parse(solc.compile(solcInput));

      // Check for compilation errors
      if (output.errors?.some((error: any) => error.severity === 'error')) {
        return res.status(400).json({
          error: "Compilation failed",
          details: output.errors
        });
      }

      // Extract compiled contract (assuming single contract)
      const contractFile = Object.keys(output.contracts['contract.sol'])[0];
      const contract = output.contracts['contract.sol'][contractFile];

      // Return ABI and bytecode
      res.json({
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object
      });

    } catch (error) {
      console.error("Compilation error:", error);
      res.status(500).json({
        error: "Failed to compile contract",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AI Contract Generation endpoint
  app.post("/api/ai/generate", async (req: any, res: any) => {
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

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const systemPrompt = `You are a smart contract expert. Analyze the provided smart contract and return a detailed analysis in the following JSON format:
{
  "title": "Contract name/title",
  "description": "Brief overview of the contract",
  "purpose": "Main purpose of the contract",
  "category": "Contract category/type",
  "mainFeatures": ["Array of main features"],
  "functions": [{
    "name": "Function name",
    "description": "What the function does",
    "visibility": "public/private/external/internal",
    "parameters": ["Array of parameters with types"],
    "returns": "Return value description"
  }],
  "events": ["Array of main events emitted"],
  "modifiers": ["Array of access modifiers"],
  "version": "Solidity version",
  "interfaces": ["Implemented interfaces"],
  "inheritance": ["Inherited contracts"],
  "stateVariables": ["Important state variables"],
  "accessControl": ["Access control mechanisms"],
  "securityFeatures": ["Security features implemented"],
  "securityConsiderations": ["Security considerations"]
}`;

      // Get AI analysis of the contract
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: "Analyze this smart contract:\n\n" + (description || "No contract description available") 
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const analysis = parseOpenAIResponse(completion.choices[0].message.content);
      const formattedAnalysis = formatContractAnalysis(analysis);

      // Prepare response object
      const response: any = {
        analysis: formattedAnalysis
      };
      
      res.json(response);

    } catch (error) {
      console.error("Contract analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze contract",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
