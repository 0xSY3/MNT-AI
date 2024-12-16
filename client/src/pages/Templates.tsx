import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CodeViewer } from "@/components/ui/code-viewer";
import { Search, FileCode, ArrowRight } from "lucide-react";
import { GridBackground, ScrollLines, FloatingParticles } from "@/components/ui/background-effects";
import { Navbar } from "@/components/ui/navbar";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  code: string;
  fileType: 'sol' | 'js' | 'ts';
  features: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  gas: 'low' | 'medium' | 'high';
  lastUpdated: string;
  aiPrompts?: {
    improvements?: string;
    security?: string;
    optimization?: string;
  };
}

const DUMMY_TEMPLATES: Template[] = [
  {
    id: 1,
    name: "ERC20 Token",
    description: "Standard ERC20 token with minting and burning capabilities",
    category: "Tokens",
    features: ["Mintable", "Burnable", "Pausable", "Access Control"],
    difficulty: "beginner",
    gas: "low",
    lastUpdated: "2024-12-10",
    fileType: "sol",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyToken is ERC20, ERC20Burnable, Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("MyToken", "MTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}`,
    aiPrompts: {
      improvements: "What additional features would you like to add to this ERC20 token? I can help with:\n1. Token vesting\n2. Token lockup\n3. Snapshot functionality\n4. Fee mechanisms",
      security: "Would you like me to review the security aspects of:\n1. Access control implementation\n2. Pausability conditions\n3. Overflow protection",
      optimization: "I can help optimize:\n1. Gas usage in transfer operations\n2. Storage layout\n3. Role management"
    }
  },
  {
    id: 2,
    name: "NFT Collection",
    description: "Full-featured NFT collection with whitelist and royalties",
    category: "NFTs",
    features: ["Whitelist", "Royalties", "Reveal", "Batch Mint"],
    difficulty: "intermediate",
    gas: "medium",
    lastUpdated: "2024-12-09",
    fileType: "sol",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MyNFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    uint256 public constant MINT_PRICE = 0.08 ether;
    uint256 public constant MAX_SUPPLY = 10000;
    
    bool public revealed = false;
    string private baseURInotRevealed;
    string private baseURIrevealed;
    
    bytes32 public merkleRoot;
    mapping(address => bool) public whitelistClaimed;

    constructor(
        string memory notRevealedUri,
        bytes32 _merkleRoot
    ) ERC721("MyNFT", "MNFT") {
        baseURInotRevealed = notRevealedUri;
        merkleRoot = _merkleRoot;
        _setDefaultRoyalty(msg.sender, 250); // 2.5% royalty
    }

    function whitelistMint(bytes32[] calldata _merkleProof) public payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(!whitelistClaimed[msg.sender], "Address already claimed");
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid proof");

        whitelistClaimed[msg.sender] = true;
        safeMint(msg.sender);
    }

    function reveal() public onlyOwner {
        revealed = true;
    }

    function safeMint(address to) public payable {
        require(totalSupply() < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function batchMint(uint256 quantity) public payable {
        require(quantity <= 20, "Max 20 NFTs per tx");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        
        for(uint256 i = 0; i < quantity; i++) {
            safeMint(msg.sender);
        }
    }

    function _baseURI() internal view override returns (string memory) {
        return revealed ? baseURIrevealed : baseURInotRevealed;
    }

    function setBaseURIRevealed(string memory _newBaseURI) public onlyOwner {
        baseURIrevealed = _newBaseURI;
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success);
    }

    // Required overrides
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage, ERC721Royalty)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`,
    aiPrompts: {
      improvements: "What additional features would you like to add to this NFT collection? I can help with:\n1. Dynamic metadata generation\n2. Rarity system\n3. Staking functionality\n4. Trading mechanisms",
      security: "Would you like me to review the security aspects of:\n1. Merkle proof verification\n2. Withdrawal pattern\n3. Royalty implementation",
      optimization: "I can help optimize:\n1. Batch minting gas usage\n2. Storage efficiency\n3. Enumerable implementation"
    }
  },
  {
    id: 3,
    name: "DAO Governance",
    description: "Decentralized governance system with proposal voting",
    category: "Governance",
    features: ["Proposal Creation", "Voting", "Timelock", "Delegation"],
    difficulty: "advanced",
    gas: "high",
    lastUpdated: "2024-12-08",
    fileType: "sol",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract MyGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    )
        Governor("MyGovernor")
        GovernorSettings(
            _votingDelay, /* 1 day */
            _votingPeriod, /* 1 week */
            0
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
        GovernorTimelockControl(_timelock)
    {}

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`,
    aiPrompts: {
      improvements: "What additional features would you like to add to this DAO? I can help with:\n1. Multiple voting strategies\n2. Proposal categories\n3. Emergency controls\n4. Reputation system",
      security: "Would you like me to review the security aspects of:\n1. Timelock configuration\n2. Voting mechanisms\n3. Quorum requirements",
      optimization: "I can help optimize:\n1. Gas costs for proposal creation\n2. Voting efficiency\n3. State transitions"
    }
  },
  {
    id: 4,
    name: "Staking Pool",
    description: "Flexible staking system with rewards distribution",
    category: "DeFi",
    features: ["Staking", "Rewards", "Emergency Withdraw", "Fee System"],
    difficulty: "intermediate",
    gas: "medium",
    lastUpdated: "2024-12-07",
    fileType: "sol",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StakingPool {
    // Contract code here
}`
  },
  {
    id: 5,
    name: "Multi-Sig Wallet",
    description: "Secure multi-signature wallet with daily limits",
    category: "Security",
    features: ["Multi-Sig", "Daily Limit", "Recovery", "Batch Transactions"],
    difficulty: "advanced",
    gas: "low",
    lastUpdated: "2024-12-06",
    fileType: "sol",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSigWallet {
    // Contract code here
}`
  },
  {
    id: 6,
    name: "Token Vesting",
    description: "Token vesting with cliff and linear release",
    category: "Tokens",
    features: ["Cliff Period", "Linear Vesting", "Revocable", "Multiple Beneficiaries"],
    difficulty: "intermediate",
    gas: "low",
    lastUpdated: "2024-12-05",
    fileType: "sol",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TokenVesting {
    // Contract code here
}`
  }
];

export default function Templates() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Using dummy data for now
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return DUMMY_TEMPLATES;
    }
  });

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = templates ? Array.from(new Set(templates.map(t => t.category))) : [];

  return (
    <div className="relative min-h-screen bg-black text-white">
      <GridBackground />
      <ScrollLines />
      <FloatingParticles />
      <Navbar isScrolled={isScrolled} />
      
      <main className="relative z-10 pt-24 pb-20 space-y-6 max-w-6xl mx-auto px-6">
        <div className="text-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full text-sm font-medium 
            bg-purple-500/10 border border-purple-500/20 animate-in fade-in slide-in-from-bottom-3">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Smart Contract Library 📚
            </span>
          </div>
          <div className="mb-8 space-y-4">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight">
              Smart Contract
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Templates
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore and use pre-built smart contract templates for your decentralized applications
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-background/80 backdrop-blur-sm border-primary/20"
            />
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1 border-primary/20 backdrop-blur-sm bg-background/95">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  <Button
                    key="all"
                    variant="ghost"
                    className={`w-full justify-start transition-colors ${
                      !selectedCategory ? 'bg-purple-500/20 text-purple-400' : 'hover:text-purple-400 hover:bg-purple-500/10'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Categories
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant="ghost"
                      className={`w-full justify-start transition-colors ${
                        selectedCategory === category ? 'bg-purple-500/20 text-purple-400' : 'hover:text-purple-400 hover:bg-purple-500/10'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates?.map((template) => (
                <Card key={template.id} className="border-purple-500/20 backdrop-blur-sm bg-purple-900/10 hover:border-purple-500/40 transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <CardTitle className="flex items-center space-x-2 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                          <FileCode className="h-5 w-5 text-purple-400" />
                          <span>{template.name}</span>
                        </CardTitle>
                        <CardDescription className="text-white/60">{template.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`
                          ${template.difficulty === 'beginner' ? 'bg-green-500/10 text-green-400' : 
                            template.difficulty === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' : 
                            'bg-red-500/10 text-red-400'}
                        `}>
                          {template.difficulty}
                        </Badge>
                        <Badge variant="outline" className={`
                          ${template.gas === 'low' ? 'bg-green-500/10 text-green-400' : 
                            template.gas === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 
                            'bg-red-500/10 text-red-400'}
                        `}>
                          {template.gas} gas
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {template.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-white/40">
                        Updated: {new Date(template.lastUpdated).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                          onClick={() => {
                            navigator.clipboard.writeText(template.code);
                            toast({
                              title: "Copied to clipboard",
                              description: "Template code has been copied to your clipboard",
                            });
                          }}
                        >
                          Copy
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          Edit
                        </Button>
      {/* Code Viewer Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="h-5 w-5 text-purple-400" />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  {selectedTemplate?.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedTemplate) {
                      navigator.clipboard.writeText(selectedTemplate.code);
                      toast({
                        title: "Code copied",
                        description: "Template code has been copied to clipboard"
                      });
                    }
                  }}
                >
                  Copy Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedTemplate) {
                      const blob = new Blob([selectedTemplate.code], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `template.${selectedTemplate.fileType}`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast({
                        title: "File downloaded",
                        description: `Template saved as template.${selectedTemplate.fileType}`
                      });
                    }
                  }}
                >
                  Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 h-full">
            <div className="col-span-2 overflow-hidden">
              <CodeViewer
                code={selectedTemplate?.code || ""}
                language={selectedTemplate?.fileType === 'sol' ? 'solidity' : selectedTemplate?.fileType}
                className="h-full"
              />
            </div>
            <div className="space-y-4">
              <Card className="border-purple-500/20 bg-purple-900/10">
                <CardHeader>
                  <CardTitle>AI Assistant</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTemplate?.aiPrompts?.improvements && (
                    <div>
                      <h4 className="font-semibold mb-2">Improvements</h4>
                      <p className="text-sm text-gray-400 whitespace-pre-line">
                        {selectedTemplate.aiPrompts.improvements}
                      </p>
                    </div>
                  )}
                  {selectedTemplate?.aiPrompts?.security && (
                    <div>
                      <h4 className="font-semibold mb-2">Security</h4>
                      <p className="text-sm text-gray-400 whitespace-pre-line">
                        {selectedTemplate.aiPrompts.security}
                      </p>
                    </div>
                  )}
                  {selectedTemplate?.aiPrompts?.optimization && (
                    <div>
                      <h4 className="font-semibold mb-2">Optimization</h4>
                      <p className="text-sm text-gray-400 whitespace-pre-line">
                        {selectedTemplate.aiPrompts.optimization}
                      </p>
                    </div>
                  )}
                  <div className="pt-4">
                    <Button className="w-full" variant="default">
                      Chat with AI Assistant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 group-hover:translate-x-1 transition-all duration-300"
                          onClick={() => {
                            const blob = new Blob([template.code], { type: 'text/plain' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `template.${template.fileType}`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            toast({
                              title: "File downloaded",
                              description: `Template saved as template.${template.fileType}`
                            });
                          }}
                        >
                          Download <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
