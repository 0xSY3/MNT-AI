
declare module 'solc' {
  interface CompilerInput {
    language: string;
    sources: {
      [key: string]: {
        content: string;
      };
    };
    settings: {
      optimizer?: {
        enabled?: boolean;
        runs?: number;
      };
      evmVersion?: string;
      outputSelection: {
        [key: string]: {
          [key: string]: string[];
        };
      };
    };
  }

  interface CompilerOutput {
    errors?: Array<{
      severity: string;
      message: string;
    }>;
    contracts: {
      [key: string]: {
        [key: string]: {
          abi: any[];
          evm: {
            bytecode: {
              object: string;
            };
          };
        };
      };
    };
  }

  function compile(input: string): string;
}
