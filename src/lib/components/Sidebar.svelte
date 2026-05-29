<script lang="ts">
  import { canvasStore } from '../stores/canvasStore';
  import { TEMPLATES } from '../utils/templates';
  import type { Template } from '../utils/templates';
  import type { CanvasItem } from '../types';
  import { 
    LayoutTemplate, 
    Square, 
    Circle, 
    Triangle, 
    Sparkles, 
    Type, 
    UploadCloud, 
    Paintbrush, 
    Layers, 
    Lock, 
    Unlock, 
    Trash2, 
    ChevronUp, 
    ChevronDown, 
    Eye, 
    EyeOff,
    Image as ImageIcon
  } from '@lucide/svelte';
  import confetti from 'canvas-confetti';

  // Generate SVG Path from freehand points (for thumbnail previews)
  function generateSvgPath(points: { x: number; y: number }[]): string {
    if (!points || points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  // Svelte 5 reactive bindings
  let { activeTab = $bindable('templates'), isDrawMode = $bindable(false), brushColor = $bindable('#7d2ae8'), brushWidth = $bindable(8) } = $props();

  // Local state for uploads
  let uploadedImages: string[] = $state([]);

  // Local state for tracking which layer is being renamed
  let renamingItemId: string | null = $state(null);
  let renamingText = $state('');

  // Subscribe to canvasStore to display layers
  let items = $derived($canvasStore.items);
  let selectedItemId = $derived($canvasStore.selectedItemId);

  // Initialize uploads from localStorage on mount
  import { onMount } from 'svelte';
  onMount(() => {
    const saved = localStorage.getItem('canvas_uploads');
    if (saved) {
      try {
        uploadedImages = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  });

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Src = e.target?.result as string;
      if (base64Src) {
        uploadedImages = [base64Src, ...uploadedImages];
        localStorage.setItem('canvas_uploads', JSON.stringify(uploadedImages));
      }
    };
    reader.readAsDataURL(file);
  }

  function addUploadedImage(src: string) {
    // Add image to canvas
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      const width = 200;
      const height = 200 / aspectRatio;
      canvasStore.addItem({
        type: 'image',
        name: 'Uploaded Image',
        x: ($canvasStore.config.width - width) / 2,
        y: ($canvasStore.config.height - height) / 2,
        width,
        height,
        rotation: 0,
        opacity: 1,
        locked: false,
        src,
        aspectRatio
      });
    };
    img.src = src;
  }

  function addText(preset: 'heading' | 'subheading' | 'body') {
    let textProps: Omit<Extract<CanvasItem, { type: 'text' }>, 'id'>;

    if (preset === 'heading') {
      textProps = {
        type: 'text',
        name: 'Heading Text',
        text: 'Add Heading',
        fontSize: 36,
        fontFamily: 'Outfit',
        color: '#0f172a',
        fontWeight: '800',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.2,
        x: ($canvasStore.config.width - 300) / 2,
        y: ($canvasStore.config.height - 60) / 2,
        width: 300,
        height: 60,
        rotation: 0,
        opacity: 1,
        locked: false
      };
    } else if (preset === 'subheading') {
      textProps = {
        type: 'text',
        name: 'Sub-heading Text',
        text: 'Add sub-heading text',
        fontSize: 20,
        fontFamily: 'Inter',
        color: '#475569',
        fontWeight: '600',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.2,
        x: ($canvasStore.config.width - 250) / 2,
        y: ($canvasStore.config.height - 40) / 2,
        width: 250,
        height: 40,
        rotation: 0,
        opacity: 1,
        locked: false
      };
    } else {
      textProps = {
        type: 'text',
        name: 'Paragraph Text',
        text: 'Click here to write body text...',
        fontSize: 14,
        fontFamily: 'Inter',
        color: '#64748b',
        fontWeight: '400',
        fontStyle: 'normal',
        textDecoration: 'none',
        align: 'center',
        lineHeight: 1.5,
        x: ($canvasStore.config.width - 200) / 2,
        y: ($canvasStore.config.height - 100) / 2,
        width: 200,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false
      };
    }

    canvasStore.addItem(textProps);
  }

  function addShape(shapeType: 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'pentagon' | 'hexagon') {
    canvasStore.addItem({
      type: 'shape',
      name: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
      shapeType,
      fill: '#7d2ae8',
      strokeColor: 'transparent',
      strokeWidth: 0,
      borderRadius: shapeType === 'rect' ? 8 : 0,
      x: ($canvasStore.config.width - 100) / 2,
      y: ($canvasStore.config.height - 100) / 2,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      locked: false
    });
  }

  function loadTemplate(template: Template) {
    canvasStore.loadProject(template.items as CanvasItem[], template.config);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  function toggleLock(item: CanvasItem) {
    canvasStore.updateItem(item.id, { locked: !item.locked });
  }

  function toggleVisibility(item: CanvasItem) {
    const newOpacity = item.opacity === 0 ? 1 : 0;
    canvasStore.updateItem(item.id, { opacity: newOpacity });
  }

  // Dragstart setup for drag-and-drop
  function handleDragStart(e: DragEvent, type: 'shape' | 'text' | 'image', value: string) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('item-type', type);
    e.dataTransfer.setData('item-val', value);
    e.dataTransfer.effectAllowed = 'copy';
  }

  function startRenaming(item: CanvasItem) {
    renamingItemId = item.id;
    renamingText = item.name;
  }

  function finishRenaming(id: string) {
    if (renamingText.trim()) {
      canvasStore.updateItem(id, { name: renamingText.trim() });
    }
    renamingItemId = null;
  }

  function handleRenamingKeydown(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter') {
      finishRenaming(id);
    } else if (e.key === 'Escape') {
      renamingItemId = null;
    }
  }

  // Handle draw mode change
  $effect(() => {
    isDrawMode = activeTab === 'draw';
  });
</script>

<!-- Canva Style Sidebar Layout (Light theme, minimal borders) -->
<div class="flex h-full w-[360px] bg-white border-r border-slate-200 text-slate-700">
  
  <!-- Left Side: Collapsed navigation icons strip (white/gray) -->
  <div class="w-[72px] bg-slate-50 flex flex-col items-center py-4 gap-4 border-r border-slate-200/60 select-none">
    <button 
      onclick={() => activeTab = 'templates'}
      class="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-[10px] font-semibold transition-all hover:bg-slate-200/50 {activeTab === 'templates' ? 'text-violet-600 bg-white shadow-sm border border-slate-200' : 'text-slate-500'}"
    >
      <LayoutTemplate class="w-4 h-4" />
      Templates
    </button>

    <button 
      onclick={() => activeTab = 'shapes'}
      class="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-[10px] font-semibold transition-all hover:bg-slate-200/50 {activeTab === 'shapes' ? 'text-violet-600 bg-white shadow-sm border border-slate-200' : 'text-slate-500'}"
    >
      <Square class="w-4 h-4" />
      Elements
    </button>

    <button 
      onclick={() => activeTab = 'text'}
      class="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-[10px] font-semibold transition-all hover:bg-slate-200/50 {activeTab === 'text' ? 'text-violet-600 bg-white shadow-sm border border-slate-200' : 'text-slate-500'}"
    >
      <Type class="w-4 h-4" />
      Text
    </button>

    <button 
      onclick={() => activeTab = 'uploads'}
      class="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-[10px] font-semibold transition-all hover:bg-slate-200/50 {activeTab === 'uploads' ? 'text-violet-600 bg-white shadow-sm border border-slate-200' : 'text-slate-500'}"
    >
      <UploadCloud class="w-4 h-4" />
      Uploads
    </button>

    <button 
      onclick={() => activeTab = 'draw'}
      class="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-[10px] font-semibold transition-all hover:bg-slate-200/50 {activeTab === 'draw' ? 'text-violet-600 bg-white shadow-sm border border-slate-200' : 'text-slate-500'}"
    >
      <Paintbrush class="w-4 h-4" />
      Draw
    </button>

    <button 
      onclick={() => activeTab = 'layers'}
      class="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl text-[10px] font-semibold transition-all hover:bg-slate-200/50 {activeTab === 'layers' ? 'text-violet-600 bg-white shadow-sm border border-slate-200' : 'text-slate-500'}"
    >
      <div class="relative">
        <Layers class="w-4 h-4" />
        {#if items.length > 0}
          <span class="absolute -top-1.5 -right-2 px-1 py-0.5 text-[8px] bg-violet-600 rounded-full font-bold text-white min-w-3 text-center leading-none">{items.length}</span>
        {/if}
      </div>
      Layers
    </button>
  </div>

  <!-- Right Side: Content Drawer panel (white background, dark text) -->
  <div class="flex-1 p-5 overflow-y-auto select-none">
    
    <!-- TEMPLATES TAB -->
    {#if activeTab === 'templates'}
      <div class="flex items-center gap-2 mb-4">
        <LayoutTemplate class="w-4 h-4 text-violet-600" />
        <h2 class="font-display text-sm font-extrabold text-slate-900 uppercase tracking-wider">Templates</h2>
      </div>

      <div class="flex flex-col gap-4">
        {#each TEMPLATES as template}
          <button 
            onclick={() => loadTemplate(template)}
            class="group w-full text-left rounded-lg overflow-hidden bg-white border border-slate-200 transition-all hover:border-violet-500 hover:shadow-sm"
          >
            <div class="h-28 w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-200/50 relative">
              <div 
                style="
                  width: {template.config.width}px;
                  height: {template.config.height}px;
                  background: {template.config.backgroundColor};
                  transform: scale({Math.min(248 / template.config.width, 112 / template.config.height) * 0.95});
                  transform-origin: center center;
                "
                class="relative shadow-md shrink-0 pointer-events-none select-none"
              >
                <!-- Render elements of the template -->
                {#each template.items as item}
                  <div 
                    class="absolute"
                    style="
                      left: {item.x}px; 
                      top: {item.y}px; 
                      width: {item.width}px; 
                      height: {item.height}px; 
                      transform: rotate({item.rotation || 0}deg); 
                      opacity: {item.opacity !== undefined ? item.opacity : 1};
                    "
                  >
                    {#if item.type === 'text'}
                      <div 
                        class="w-full h-full flex items-center justify-center text-center whitespace-pre-wrap"
                        style="
                          font-size: {item.fontSize}px; 
                          font-family: {item.fontFamily}; 
                          color: {item.color}; 
                          font-weight: {item.fontWeight}; 
                          font-style: {item.fontStyle}; 
                          text-decoration: {item.textDecoration};
                          text-align: {item.align};
                          line-height: {item.lineHeight};
                        "
                      >
                        {item.text}
                      </div>
                    {:else if item.type === 'shape'}
                      <svg class="w-full h-full overflow-visible pointer-events-none">
                        {#if item.shapeType === 'rect'}
                          <rect 
                            x={item.strokeWidth / 2}
                            y={item.strokeWidth / 2}
                            width={item.width - item.strokeWidth}
                            height={item.height - item.strokeWidth}
                            fill={item.fill}
                            stroke={item.strokeColor}
                            stroke-width={item.strokeWidth}
                            rx={item.borderRadius}
                            ry={item.borderRadius}
                          />
                        {:else if item.shapeType === 'circle'}
                          <circle 
                            cx={item.width / 2} 
                            cy={item.height / 2} 
                            r={Math.min(item.width, item.height) / 2 - item.strokeWidth / 2}
                            fill={item.fill}
                            stroke={item.strokeColor}
                            stroke-width={item.strokeWidth}
                          />
                        {:else if item.shapeType === 'triangle'}
                          <polygon 
                            points="
                              {item.width / 2},{item.strokeWidth} 
                              {item.strokeWidth},{item.height - item.strokeWidth} 
                              {item.width - item.strokeWidth},{item.height - item.strokeWidth}
                            "
                            fill={item.fill}
                            stroke={item.strokeColor}
                            stroke-width={item.strokeWidth}
                          />
                        {:else if item.shapeType === 'star'}
                          <polygon 
                            points="
                              {item.width * 0.5},{item.strokeWidth}
                              {item.width * 0.62},{item.height * 0.38}
                              {item.width - item.strokeWidth},{item.height * 0.38}
                              {item.width * 0.70},{item.height * 0.62}
                              {item.width * 0.81},{item.height - item.strokeWidth}
                              {item.width * 0.5},{item.height * 0.78}
                              {item.width * 0.19},{item.height - item.strokeWidth}
                              {item.width * 0.30},{item.height * 0.62}
                              {item.strokeWidth},{item.height * 0.38}
                              {item.width * 0.38},{item.strokeWidth * 0.38}
                            "
                            fill={item.fill}
                            stroke={item.strokeColor}
                            stroke-width={item.strokeWidth}
                          />
                        {:else if item.shapeType === 'pentagon'}
                          <polygon 
                            points="
                              {item.width * 0.5},{item.strokeWidth}
                              {item.width - item.strokeWidth},{item.height * 0.38}
                              {item.width * 0.82},{item.height - item.strokeWidth}
                              {item.width * 0.18},{item.height - item.strokeWidth}
                              {item.strokeWidth},{item.height * 0.38}
                            "
                            fill={item.fill}
                            stroke={item.strokeColor}
                            stroke-width={item.strokeWidth}
                          />
                        {:else if item.shapeType === 'hexagon'}
                          <polygon 
                            points="
                              {item.width * 0.25},{item.strokeWidth}
                              {item.width * 0.75},{item.strokeWidth}
                              {item.width - item.strokeWidth},{item.height * 0.5}
                              {item.width * 0.75},{item.height - item.strokeWidth}
                              {item.width * 0.25},{item.height - item.strokeWidth}
                              {item.strokeWidth},{item.height * 0.5}
                            "
                            fill={item.fill}
                            stroke={item.strokeColor}
                            stroke-width={item.strokeWidth}
                          />
                        {/if}
                      </svg>
                    {:else if item.type === 'image'}
                      <img 
                        src={item.src} 
                        alt={item.name}
                        class="w-full h-full object-fill rounded-sm"
                      />
                    {:else if item.type === 'drawing'}
                      <svg class="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        <path 
                          d={generateSvgPath(item.points)}
                          fill="none"
                          stroke={item.strokeColor}
                          stroke-width={item.strokeWidth}
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
            <div class="p-3">
              <div class="flex items-center gap-1.5 justify-between">
                <h3 class="text-xs font-bold text-slate-800 group-hover:text-violet-600 transition-colors truncate">{template.name}</h3>
                <span class="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{template.category}</span>
              </div>
              <p class="text-[10px] text-slate-450 mt-1 line-clamp-1">{template.description}</p>
            </div>
          </button>
        {/each}
      </div>
    {/if}

    <!-- SHAPES TAB -->
    {#if activeTab === 'shapes'}
      <div class="flex items-center gap-2 mb-4">
        <Square class="w-4 h-4 text-violet-600" />
        <h2 class="font-display text-sm font-extrabold text-slate-900 uppercase tracking-wider">Elements</h2>
      </div>

      <div class="grid grid-cols-2 gap-2">
        {#each [
          { type: 'rect', label: 'Rectangle', icon: Square },
          { type: 'circle', label: 'Circle', icon: Circle },
          { type: 'triangle', label: 'Triangle', icon: Triangle },
          { type: 'star', label: 'Star', icon: Sparkles }
        ] as shape}
          <button 
            onclick={() => addShape(shape.type as any)}
            draggable="true"
            ondragstart={(e) => handleDragStart(e, 'shape', shape.type)}
            class="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-violet-400 hover:text-slate-900 transition-all text-[11px] font-semibold gap-1.5 text-slate-700 cursor-grab active:cursor-grabbing"
          >
            <shape.icon class="w-5 h-5 text-slate-500 pointer-events-none" />
            {shape.label}
          </button>
        {/each}

        <!-- Custom poly shapes -->
        <button 
          onclick={() => addShape('pentagon')}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, 'shape', 'pentagon')}
          class="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-violet-400 hover:text-slate-900 transition-all text-[11px] font-semibold gap-1.5 text-slate-700 cursor-grab active:cursor-grabbing"
        >
          <div class="w-5 h-5 bg-slate-500 pointer-events-none" style="clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);"></div>
          Pentagon
        </button>

        <button 
          onclick={() => addShape('hexagon')}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, 'shape', 'hexagon')}
          class="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-violet-400 hover:text-slate-900 transition-all text-[11px] font-semibold gap-1.5 text-slate-700 cursor-grab active:cursor-grabbing"
        >
          <div class="w-5 h-5 bg-slate-500 pointer-events-none" style="clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);"></div>
          Hexagon
        </button>
      </div>
      <div class="text-[10px] text-slate-450 mt-4 border-t border-slate-100 pt-3 text-center">
        💡 Click elements to add to canvas, or drag-and-drop them directly where you want!
      </div>
    {/if}

    <!-- TEXT TAB -->
    {#if activeTab === 'text'}
      <div class="flex items-center gap-2 mb-4">
        <Type class="w-4 h-4 text-violet-600" />
        <h2 class="font-display text-sm font-extrabold text-slate-900 uppercase tracking-wider">Typography</h2>
      </div>

      <div class="flex flex-col gap-3">
        <button 
          onclick={() => addText('heading')}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, 'text', 'heading')}
          class="w-full text-left p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-violet-500 hover:bg-slate-100 text-slate-900 font-display font-black text-xl transition-all cursor-grab active:cursor-grabbing"
        >
          Add Heading
        </button>

        <button 
          onclick={() => addText('subheading')}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, 'text', 'subheading')}
          class="w-full text-left p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-violet-500 hover:bg-slate-100 text-slate-800 font-sans font-bold text-sm transition-all cursor-grab active:cursor-grabbing"
        >
          Add Sub-heading
        </button>

        <button 
          onclick={() => addText('body')}
          draggable="true"
          ondragstart={(e) => handleDragStart(e, 'text', 'body')}
          class="w-full text-left p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-violet-500 hover:bg-slate-100 text-slate-600 font-sans text-xs transition-all cursor-grab active:cursor-grabbing"
        >
          Add body text paragraph
        </button>
      </div>
      <div class="text-[10px] text-slate-450 mt-4 border-t border-slate-100 pt-3 text-center">
        💡 Drag-and-drop texts onto your design sheet!
      </div>
    {/if}

    <!-- UPLOADS TAB -->
    {#if activeTab === 'uploads'}
      <div class="flex items-center gap-2 mb-4">
        <UploadCloud class="w-4 h-4 text-violet-600" />
        <h2 class="font-display text-sm font-extrabold text-slate-900 uppercase tracking-wider">Uploads</h2>
      </div>

      <div class="flex flex-col gap-4">
        <label 
          class="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 hover:border-violet-500 rounded-lg cursor-pointer bg-slate-50 hover:bg-violet-50/20 transition-all gap-1.5"
        >
          <UploadCloud class="w-6 h-6 text-slate-400" />
          <span class="text-xs text-slate-700 font-bold">Upload an image</span>
          <span class="text-[9px] text-slate-400">Supports PNG, JPG, SVG</span>
          <input type="file" accept="image/*" class="hidden" onchange={handleFileUpload} />
        </label>

        {#if uploadedImages.length > 0}
          <div class="grid grid-cols-2 gap-2 mt-2">
            {#each uploadedImages as imgSrc, index}
              <div class="relative group aspect-square bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing">
                <button 
                  onclick={() => addUploadedImage(imgSrc)}
                  draggable="true"
                  ondragstart={(e) => handleDragStart(e, 'image', imgSrc)}
                  class="w-full h-full p-1 flex items-center justify-center"
                >
                  <img src={imgSrc} alt="upload" class="max-w-full max-h-full object-contain mx-auto rounded transition-transform group-hover:scale-105 pointer-events-none" />
                </button>
                <button 
                  onclick={() => {
                    uploadedImages = uploadedImages.filter((_, i) => i !== index);
                    localStorage.setItem('canvas_uploads', JSON.stringify(uploadedImages));
                  }}
                  class="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-650 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                  title="Remove Image"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex flex-col items-center justify-center py-6 text-slate-400">
            <ImageIcon class="w-8 h-8 mb-1 stroke-1" />
            <p class="text-[11px]">No uploads yet</p>
          </div>
        {/if}
      </div>
      <div class="text-[10px] text-slate-450 mt-4 border-t border-slate-100 pt-3 text-center">
        💡 Drag uploaded images onto the canvas, or drop image files from your computer desktop directly onto the canvas area!
      </div>
    {/if}

    <!-- DRAW TAB -->
    {#if activeTab === 'draw'}
      <div class="flex items-center gap-2 mb-4">
        <Paintbrush class="w-4 h-4 text-violet-600" />
        <h2 class="font-display text-sm font-extrabold text-slate-900 uppercase tracking-wider">Drawing</h2>
      </div>

      <div class="flex flex-col gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-700">Paintbrush Active</span>
          <span class="px-2 py-0.5 text-[9px] font-bold bg-violet-100 text-violet-700 rounded border border-violet-200">ON CANVAS</span>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="brushColorPicker" class="text-[10px] font-bold text-slate-500 uppercase">Brush Color</label>
          <div class="flex items-center gap-2">
            <input 
              id="brushColorPicker"
              type="color" 
              bind:value={brushColor}
              class="w-8 h-8 border-0 rounded cursor-pointer bg-transparent"
            />
            <input 
              type="text" 
              bind:value={brushColor}
              class="flex-1 bg-white border border-slate-200 text-xs px-2 py-1.5 rounded text-slate-800 font-mono"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
            <span>Stroke Size</span>
            <span class="text-violet-600 font-bold">{brushWidth}px</span>
          </div>
          <input 
            type="range" 
            min="2" 
            max="40" 
            bind:value={brushWidth}
            class="w-full accent-violet-600 cursor-pointer"
          />
        </div>
      </div>
    {/if}

    <!-- LAYERS TAB -->
    {#if activeTab === 'layers'}
      <div class="flex items-center gap-2 mb-4">
        <Layers class="w-4 h-4 text-violet-600" />
        <h2 class="font-display text-sm font-extrabold text-slate-900 uppercase tracking-wider">Layers Panel</h2>
      </div>

      {#if items.length > 0}
        <div class="flex flex-col gap-1.5">
          {#each [...items].reverse() as item, idx (item.id)}
            <div 
              class="flex items-center gap-2 p-2.5 rounded-lg border transition-all no-select {selectedItemId === item.id ? 'bg-violet-50/50 border-violet-300 text-slate-900' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-700'}"
            >
              <button 
                onclick={() => canvasStore.setSelectedItemId(item.id)}
                class="flex-1 text-left min-w-0"
              >
                {#if renamingItemId === item.id}
                  <input 
                    type="text"
                    bind:value={renamingText}
                    onblur={() => finishRenaming(item.id)}
                    onkeydown={(e) => handleRenamingKeydown(e, item.id)}
                    class="w-full bg-white border border-violet-400 rounded px-1.5 py-0.5 text-xs text-slate-900"
                    autofocus
                  />
                {:else}
                  <div 
                    ondblclick={() => startRenaming(item)}
                    class="text-xs font-bold truncate cursor-pointer hover:text-violet-600"
                    title="Double click to rename"
                  >
                    {item.name}
                  </div>
                {/if}
                <div class="text-[9px] text-slate-440 uppercase font-bold">{item.type}</div>
              </button>

              <div class="flex flex-col gap-0.5">
                <button 
                  onclick={() => canvasStore.bringForward(item.id)}
                  disabled={idx === 0}
                  class="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                >
                  <ChevronUp class="w-3 h-3" />
                </button>
                <button 
                  onclick={() => canvasStore.sendBackward(item.id)}
                  disabled={idx === items.length - 1}
                  class="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"
                >
                  <ChevronDown class="w-3 h-3" />
                </button>
              </div>

              <div class="flex items-center gap-0.5 ml-1">
                <button 
                  onclick={() => toggleVisibility(item)}
                  class="p-1 text-slate-400 hover:text-slate-800"
                >
                  {#if item.opacity === 0}
                    <EyeOff class="w-3 h-3 text-red-500" />
                  {:else}
                    <Eye class="w-3 h-3" />
                  {/if}
                </button>

                <button 
                  onclick={() => toggleLock(item)}
                  class="p-1 text-slate-400 hover:text-slate-800"
                >
                  {#if item.locked}
                    <Lock class="w-3 h-3 text-amber-500" />
                  {:else}
                    <Unlock class="w-3 h-3" />
                  {/if}
                </button>

                <button 
                  onclick={() => canvasStore.deleteItem(item.id)}
                  class="p-1 text-slate-400 hover:text-red-600"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center py-8 text-slate-400 text-center">
          <Layers class="w-8 h-8 mb-1.5 stroke-1" />
          <p class="text-[11px]">No layers on the canvas</p>
        </div>
      {/if}
    {/if}

  </div>
</div>
