import { useState } from "react";
import { editor } from "monaco-editor";
import Editor from "@monaco-editor/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Save } from "lucide-react";

interface ContractEditorProps {
  initialValue?: string;
  onSave?: (code: string) => void;
  onCompile?: (code: string) => void;
}

export default function ContractEditor({ 
  initialValue = "", 
  onSave,
  onCompile 
}: ContractEditorProps) {
  const [code, setCode] = useState(initialValue);

  const handleEditorChange = (value: string = "") => {
    setCode(value);
  };

  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on",
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    theme: "vs-dark",
    wordWrap: "on"
  };

  return (
    <Card className="border-primary/20">
      <Tabs defaultValue="editor">
        <div className="flex justify-between items-center p-2 border-b border-border/40">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <div className="space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onSave?.(code)}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              size="sm"
              onClick={() => onCompile?.(code)}
            >
              <Play className="mr-2 h-4 w-4" />
              Compile
            </Button>
          </div>
        </div>

        <TabsContent value="editor" className="m-0">
          <div className="h-[600px] border-0">
            <Editor
              defaultLanguage="solidity"
              value={code}
              onChange={handleEditorChange}
              options={editorOptions}
              theme="vs-dark"
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="h-[600px] p-4 font-mono text-sm overflow-auto">
            <pre>{code}</pre>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
