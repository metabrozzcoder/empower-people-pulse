import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

import { useToast } from '@/hooks/use-toast'

type Mode = 'audio' | 'video'
type Role = 'caller' | 'callee'

interface Peer { id: string; name: string; avatar?: string }

interface Props {
  open: boolean
  onClose: () => void
  mode: Mode
  role: Role
  conversationId: string
  myId: string
  peer: Peer
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
}

export default function CallDialog({ open, onClose, mode, role, conversationId, myId, peer }: Props) {
  const { toast } = useToast()
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(mode === 'audio')
  const [status, setStatus] = useState<'connecting' | 'ringing' | 'in-call' | 'ended'>('connecting')

  const cleanup = () => {
    try { pcRef.current?.getSenders().forEach(s => s.track?.stop()) } catch {}
    try { pcRef.current?.close() } catch {}
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
  }

  const endCall = () => {
    try { channelRef.current?.send({ type: 'broadcast', event: 'call-end', payload: { from: myId } }) } catch {}
    cleanup(); setStatus('ended'); onClose()
  }

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const start = async () => {
      const pc = new RTCPeerConnection(RTC_CONFIG)
      pcRef.current = pc

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === 'video' ? { width: 640, height: 480 } : false,
        })
      } catch (e: any) {
        toast({ title: 'Camera/Mic blocked', description: e?.message || 'Permission denied', variant: 'destructive' })
        endCall(); return
      }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
      localStreamRef.current = stream
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      pc.ontrack = (ev) => {
        if (remoteVideoRef.current && ev.streams[0]) {
          remoteVideoRef.current.srcObject = ev.streams[0]
          setStatus('in-call')
        }
      }

      const channel = supabase.channel(`call-${conversationId}`, { config: { broadcast: { self: false } } })
      channelRef.current = channel

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          channel.send({ type: 'broadcast', event: 'ice', payload: { from: myId, candidate: ev.candidate.toJSON() } })
        }
      }

      channel
        .on('broadcast', { event: 'ice' }, async ({ payload }) => {
          if (payload.from === myId || !payload.candidate) return
          try { await pc.addIceCandidate(payload.candidate) } catch {}
        })
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (payload.from === myId || role !== 'callee') return
          await pc.setRemoteDescription(payload.sdp)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          channel.send({ type: 'broadcast', event: 'answer', payload: { from: myId, sdp: answer } })
          setStatus('in-call')
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          if (payload.from === myId || role !== 'caller') return
          await pc.setRemoteDescription(payload.sdp)
          setStatus('in-call')
        })
        .on('broadcast', { event: 'call-end' }, ({ payload }) => {
          if (payload.from === myId) return
          toast({ title: 'Call ended', description: `${peer.name} ended the call` })
          cleanup(); setStatus('ended'); onClose()
        })
        .subscribe(async (st) => {
          if (st !== 'SUBSCRIBED') return
          if (role === 'caller') {
            setStatus('ringing')
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            channel.send({ type: 'broadcast', event: 'offer', payload: { from: myId, sdp: offer, mode } })
          }
        })
    }

    start()
    return () => { cancelled = true; cleanup() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggleMute = () => {
    const enabled = !muted
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !enabled })
    setMuted(enabled)
  }
  const toggleVideo = () => {
    const off = !videoOff
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !off })
    setVideoOff(off)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) endCall() }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-8 h-8"><AvatarImage src={peer.avatar} /><AvatarFallback>{peer.name.slice(0,2)}</AvatarFallback></Avatar>
            <span>{mode === 'video' ? 'Video call' : 'Voice call'} · {peer.name}</span>
            <span className="text-xs text-muted-foreground ml-auto capitalize">{status}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={remoteVideoRef} autoPlay playsInline className={cn('w-full h-full object-cover', mode === 'audio' && 'hidden')} />
          {mode === 'video' && (
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-3 right-3 w-32 h-24 object-cover rounded-md border border-border" />
          )}
          {mode === 'audio' && (
            <div className="flex flex-col items-center justify-center h-full text-white gap-3">
              <Avatar className="w-24 h-24"><AvatarImage src={peer.avatar} /><AvatarFallback className="text-2xl">{peer.name.slice(0,2)}</AvatarFallback></Avatar>
              <p className="text-lg">{peer.name}</p>
              <p className="text-sm opacity-70 capitalize">{status}</p>
            </div>
          )}
        </div>


        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant={muted ? 'destructive' : 'secondary'} size="icon" onClick={toggleMute}>
            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          {mode === 'video' && (
            <Button variant={videoOff ? 'destructive' : 'secondary'} size="icon" onClick={toggleVideo}>
              {videoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </Button>
          )}
          <Button variant="destructive" onClick={endCall} className="gap-2">
            <PhoneOff className="w-4 h-4" /> End
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
