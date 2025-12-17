"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Users, TrendingUp, Award, ThumbsUp, MessageCircle, Share2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { Badge } from "@/components/ui/badge"

interface CommunityPost {
  id: string
  userName: string
  userAvatar: string
  pose: string
  score: number
  image: string
  likes: number
  comments: number
  timeAgo: string
  isLiked: boolean
}

export default function SocialView() {
  const { language } = useLanguage()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [activeTab, setActiveTab] = useState<"trending" | "following">("trending")

  useEffect(() => {
    // Mock community posts
    const mockPosts: CommunityPost[] = [
      {
        id: "1",
        userName: "Mike Rodriguez",
        userAvatar: "/determined-athlete.png",
        pose: "frontDoubleBiceps",
        score: 96,
        image: "/bodybuilder-front-double-biceps.jpg",
        likes: 234,
        comments: 45,
        timeAgo: "2h ago",
        isLiked: false,
      },
      {
        id: "2",
        userName: "Sarah Chen",
        userAvatar: "/determined-athlete.png",
        pose: "latSpread",
        score: 94,
        image: "/bodybuilder-lat-spread.jpg",
        likes: 189,
        comments: 32,
        timeAgo: "5h ago",
        isLiked: true,
      },
      {
        id: "3",
        userName: "Carlos Mendez",
        userAvatar: "/determined-athlete.png",
        pose: "sideChest",
        score: 92,
        image: "/bodybuilder-side-chest.jpg",
        likes: 156,
        comments: 28,
        timeAgo: "1d ago",
        isLiked: false,
      },
    ]

    setPosts(mockPosts)
  }, [])

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    )
  }

  const handleShare = async (post: CommunityPost) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.userName}'s ${post.pose} - PoseCoach AI`,
          text: `Check out this amazing ${post.score} score on PoseCoach AI!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log("[v0] Share cancelled or failed")
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert(language === "en" ? "Link copied to clipboard!" : "¡Enlace copiado al portapapeles!")
    }
  }

  const getPoseLabel = (pose: string) => {
    const labels: { [key: string]: { en: string; es: string } } = {
      frontDoubleBiceps: { en: "Front Double Biceps", es: "Doble Bíceps Frontal" },
      latSpread: { en: "Lat Spread", es: "Extensión de Dorsales" },
      sideChest: { en: "Side Chest", es: "Pecho Lateral" },
      backDoubleBiceps: { en: "Back Double Biceps", es: "Doble Bíceps de Espalda" },
    }
    return labels[pose]?.[language] || pose
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{language === "en" ? "Community" : "Comunidad"}</h1>
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "Connect with fellow athletes" : "Conecta con otros atletas"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 pt-2">
            <Button
              variant={activeTab === "trending" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("trending")}
              className={activeTab === "trending" ? "bg-primary" : ""}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {language === "en" ? "Trending" : "Tendencias"}
            </Button>
            <Button
              variant={activeTab === "following" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("following")}
              className={activeTab === "following" ? "bg-primary" : ""}
            >
              <Users className="w-4 h-4 mr-2" />
              {language === "en" ? "Following" : "Siguiendo"}
            </Button>
          </div>
        </div>
      </div>

      {/* Leaderboard Banner */}
      <div className="p-6 pt-4">
        <Card className="p-4 bg-gradient-to-r from-primary/20 to-chart-3/20 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{language === "en" ? "Weekly Challenge" : "Desafío Semanal"}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "en" ? "Top 10 win exclusive badges" : "Top 10 ganan insignias exclusivas"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 bg-transparent"
            >
              {language === "en" ? "Join" : "Unirse"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Posts Feed */}
      <div className="px-6 space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden bg-card border-border">
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-primary/30">
                  <img
                    src={post.userAvatar || "/placeholder.svg"}
                    alt={post.userName}
                    className="w-full h-full object-cover"
                  />
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{post.userName}</p>
                  <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">
                <Award className="w-3 h-3 mr-1" />
                {post.score}
              </Badge>
            </div>

            {/* Post Image */}
            <div className="relative aspect-square bg-secondary">
              <img src={post.image || "/placeholder.svg"} alt={post.pose} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-semibold">{getPoseLabel(post.pose)}</p>
              </div>
            </div>

            {/* Post Actions */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={`gap-2 ${post.isLiked ? "text-primary" : ""}`}
                >
                  <ThumbsUp className={`w-5 h-5 ${post.isLiked ? "fill-current" : ""}`} />
                  <span className="font-semibold">{post.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">{post.comments}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 ml-auto" onClick={() => handleShare(post)}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State for Following */}
      {activeTab === "following" && (
        <div className="px-6 mt-8">
          <Card className="p-8 bg-card border-border border-dashed">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-semibold mb-2">
                {language === "en" ? "No Following Yet" : "Sin Seguidos Aún"}
              </p>
              <p className="text-sm">
                {language === "en"
                  ? "Start following athletes to see their posts here"
                  : "Comienza a seguir atletas para ver sus publicaciones aquí"}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
