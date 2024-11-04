"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Copy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Peer from "peerjs";

export default function HostPage() {
  const [roomId, setRoomId] = useState<string>("");
  const [peer, setPeer] = useState<Peer | null>(null);
  const [viewers, setViewers] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const newPeer = new Peer();
    
    newPeer.on("open", (id) => {
      setRoomId(id);
    });

    newPeer.on("connection", (conn) => {
      setViewers((prev) => prev + 1);
      
      conn.on("close", () => {
        setViewers((prev) => prev - 1);
      });

      // Start screen sharing when someone connects
      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then((stream) => {
          const call = newPeer.call(conn.peer, stream);
          
          stream.getVideoTracks()[0].onended = () => {
            call.close();
            stream.getTracks().forEach(track => track.stop());
          };
        })
        .catch((err) => {
          toast({
            title: "Screen sharing error",
            description: "Failed to start screen sharing. Please try again.",
            variant: "destructive",
          });
        });
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Room code copied!",
      description: "Share this code with others to let them join your room.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-6 w-6" />
              Your Screen Sharing Room
            </CardTitle>
            <CardDescription>
              Share this room code with others to let them view your screen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <code className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-lg font-mono">
                {roomId || "Generating room code..."}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyRoomId}
                disabled={!roomId}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">Current Viewers</span>
              </div>
              <span className="text-lg font-semibold">{viewers}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}