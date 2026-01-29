"use client";

import { useState } from "react";
import { tutorials, tutorialCategories, Tutorial } from "@/lib/tutorials";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlayCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TutorialsPage() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTutorials = tutorials.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eğitim Videoları</h1>
          <p className="text-muted-foreground mt-2">
            Sistemin modüllerini nasıl kullanacağınızı öğrenin.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Video ara..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6 flex flex-wrap h-auto gap-2 bg-transparent justify-start p-0">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-full px-4 py-2 h-auto"
          >
            Tümü
          </TabsTrigger>
          {tutorialCategories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-full px-4 py-2 h-auto"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map(tutorial => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} onClick={() => setSelectedTutorial(tutorial)} />
            ))}
          </div>
        </TabsContent>

        {tutorialCategories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials
                .filter(t => t.category === category.id)
                .map(tutorial => (
                  <TutorialCard key={tutorial.id} tutorial={tutorial} onClick={() => setSelectedTutorial(tutorial)} />
                ))
              }
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedTutorial} onOpenChange={(open) => !open && setSelectedTutorial(null)}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black/95 border-zinc-800">
          {selectedTutorial && (
            <div className="flex flex-col">
              <div className="relative pt-[56.25%] bg-black">
                {selectedTutorial.videoUrl ? (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${selectedTutorial.videoUrl}?autoplay=1`}
                    title={selectedTutorial.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-zinc-500">
                    Video kaynağı bulunamadı (Demo)
                  </div>
                )}
              </div>
              <div className="p-6 bg-background">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {selectedTutorial.icon && <selectedTutorial.icon className="h-5 w-5 text-primary" />}
                    {selectedTutorial.title}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-base">
                    {selectedTutorial.description}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TutorialCard({ tutorial, onClick }: { tutorial: Tutorial; onClick: () => void }) {
  const Icon = tutorial.icon || PlayCircle;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-zinc-200 dark:border-zinc-800 overflow-hidden" onClick={onClick}>
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
        {tutorial.thumbnailUrl ? (
          <img src={tutorial.thumbnailUrl} alt={tutorial.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 w-full h-full flex items-center justify-center">
            <Icon className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="bg-white/90 dark:bg-black/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
            <PlayCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        {tutorial.duration && (
          <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/70 text-white hover:bg-black/80 border-0">
            <Clock className="h-3 w-3 mr-1" />
            {tutorial.duration}
          </Badge>
        )}
      </div>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2 leading-tight">
            {tutorial.title}
          </CardTitle>
        </div>
        <CardDescription className="line-clamp-2 text-xs mt-1">
          {tutorial.description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
