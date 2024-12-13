"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";

export default function JoinPage() {
    const [roomId, setRoomId] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        /**
         * 通过参数获取房间ID
         */
        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get("room");
        if (roomFromUrl) {
            setRoomId(roomFromUrl);
        }

        /**
         * 退出函数
         * 清除peer
         */
        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        /**
         * 当有数据流，则使用播放器直接播放数据流
         */
        if (videoRef.current && activeStream) {
            videoRef.current.srcObject = activeStream;
            videoRef.current.play().catch(console.error);
        }
    }, [activeStream]);

    /**
     * 加入房间
     * @param roomIdToJoin
     * @returns
     */
    function joinRoom(roomIdToJoin: string = roomId) {
        /**
         * 房间ID判断
         */
        if (!roomIdToJoin.trim()) {
            toast({
                title: "Room code required",
                description: "Please enter a valid room code.",
                variant: "destructive"
            });
            return;
        }

        /**
         * 连接状态
         */
        setIsConnecting(true);

        /**
         * 生成peer对象
         */
        const peer = new Peer({ debug: 2 });
        peerRef.current = peer;

        /**
         * peer打开事件
         */
        peer.on("open", () => {
            /**
             * 创建连接
             */
            const connection = peer.connect(roomIdToJoin);

            /**
             * 连接打开事件
             */
            connection.on("open", () => {
                toast({
                    title: "Connected!",
                    description: "Waiting for host to share their screen..."
                });
            });

            /**
             * 拨打事件
             */
            peer.on("call", (call) => {
                /**
                 * 应答
                 */
                call.answer();

                /**
                 * 数据流
                 */
                call.on("stream", (remoteStream) => {
                    setActiveStream(remoteStream);
                });
            });

            /**
             * 连接断开事件
             */
            connection.on("close", () => {
                setIsConnecting(false);
                setRoomId("");
                setActiveStream(null);
                toast({
                    title: "Disconnected",
                    description: "The session has been ended.",
                    variant: "destructive"
                });
            });
        });

        /**
         * peer错误事件
         */
        peer.on("error", (err) => {
            console.error("Peer error:", err);
            setIsConnecting(false);

            /**
             * 提示
             */
            toast({
                title: "Connection failed",
                description: "Could not connect to the room. Please check the room code and try again.",
                variant: "destructive"
            });
        });
    }

    return (
        <div className="py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <Button variant="outline" asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Join a Room
                        </CardTitle>
                        <CardDescription>Enter the room code to join and view the shared screen</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!activeStream ? (
                            <div className="space-y-4">
                                <Input placeholder="Enter room code" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={isConnecting} />
                                <Button className="w-full" onClick={() => joinRoom()} disabled={isConnecting || !roomId.trim()}>
                                    {isConnecting ? "Connecting..." : "Join Room"}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
                                    <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline loop controls />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
