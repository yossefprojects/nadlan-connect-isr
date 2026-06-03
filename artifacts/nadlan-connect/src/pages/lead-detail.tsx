import { useState } from "react";
import { useRoute } from "wouter";
import { 
  useGetLead, getGetLeadQueryKey, 
  useGetLeadMessages, getGetLeadMessagesQueryKey,
  useSendMessage
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/layout/language-provider";

export default function LeadDetail() {
  const [, params] = useRoute("/leads/:id");
  const leadId = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: leadDetail, isLoading: isLeadLoading } = useGetLead(leadId, {
    query: { enabled: !!leadId, queryKey: getGetLeadQueryKey(leadId) }
  });
  
  const { data: messages, isLoading: isMessagesLoading } = useGetLeadMessages(leadId, {
    query: { enabled: !!leadId, queryKey: getGetLeadMessagesQueryKey(leadId) }
  });

  const { user } = useAuth();
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [newMsg, setNewMsg] = useState("");

  const handleSend = () => {
    if (!newMsg.trim()) return;
    
    sendMessage.mutate({ leadId, data: { body: newMsg } }, {
      onSuccess: () => {
        setNewMsg("");
        queryClient.invalidateQueries({ queryKey: getGetLeadMessagesQueryKey(leadId) });
      },
      onError: () => {
        toast({ title: t("leadDetail.sendError"), variant: "destructive" });
      }
    });
  };

  if (isLeadLoading || isMessagesLoading) return <div className="p-8 text-center">{t("common.loading")}</div>;
  if (!leadDetail) return <div className="p-8 text-center">{t("leadDetail.notFound")}</div>;

  const { lead } = leadDetail;

  return (
    <div className="container py-8 max-w-4xl flex flex-col h-[calc(100vh-64px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">{lead.listingTitle || `${t("common.propertyNum")}${lead.listingId}`}</h1>
          <p className="text-muted-foreground text-sm">{t("leadDetail.initiatedOn")} {new Date(lead.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1 bg-background">
          {t("leadDetail.statusLabel")}: {t(`leadStatus.${lead.status}`)}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
        {/* Original Message */}
        <div className="flex flex-col items-end">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
            <p className="whitespace-pre-wrap">{lead.message}</p>
          </div>
          <span className="text-xs text-muted-foreground mt-1">{t("leadDetail.you")} - {new Date(lead.createdAt).toLocaleTimeString()}</span>
        </div>

        {/* Thread Messages */}
        {messages?.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${
                isMe 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}>
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {isMe ? t("leadDetail.you") : msg.senderName || t("leadDetail.correspondent")} - {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-background border rounded-xl p-3 shadow-sm flex items-end gap-2">
        <Textarea 
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder={t("leadDetail.messagePlaceholder")}
          className="resize-none border-0 shadow-none focus-visible:ring-0 min-h-[60px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={handleSend} disabled={!newMsg.trim() || sendMessage.isPending}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}