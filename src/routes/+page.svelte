<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import Canvas from '$lib/components/Canvas.svelte';
  import { canvasStore } from '$lib/stores/canvasStore';
  import { 
    Download, 
    Sparkles, 
    Upload, 
    FileCode, 
    FileImage, 
    FileSpreadsheet
  } from '@lucide/svelte';
  import { toPng, toJpeg, toSvg } from 'html-to-image';
  import confetti from 'canvas-confetti';

  // Svelte 5 local reactive states for sidebar and draw mode
  let activeTab = $state('templates');
  let isDrawMode = $state(false);
  let brushColor = $state('#7d2ae8'); // Canva Purple by default
  let brushWidth = $state(8);

  // Show export menu toggle
  let showExportMenu = $state(false);

  // Subscribe to store updates
  let items = $derived($canvasStore.items);
  let selectedItemId = $derived($canvasStore.selectedItemId);
  let config = $derived($canvasStore.config);

  // --- KEYBOARD SHORTCUTS ---
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      canvasStore.setSelectedItemId(null);
      return;
    }

    const activeEl = document.activeElement;
    const isEditing = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.hasAttribute('contenteditable'));
    
    if (selectedItemId && !isEditing) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        canvasStore.deleteItem(selectedItemId);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        canvasStore.duplicateItem(selectedItemId);
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const selectedItem = items.find(i => i.id === selectedItemId);
        if (selectedItem && !selectedItem.locked) {
          const step = e.shiftKey ? 10 : 1;
          let updates = {};
          if (e.key === 'ArrowUp') updates = { y: selectedItem.y - step };
          if (e.key === 'ArrowDown') updates = { y: selectedItem.y + step };
          if (e.key === 'ArrowLeft') updates = { x: selectedItem.x - step };
          if (e.key === 'ArrowRight') updates = { x: selectedItem.x + step };
          
          canvasStore.updateItem(selectedItemId, updates);
        }
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && !isEditing) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        canvasStore.undo();
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        canvasStore.redo();
      }
    }
  }

  // --- EXPORT TO IMAGE LOGIC ---
  async function exportDesign(format: 'png' | 'jpeg' | 'svg') {
    showExportMenu = false;
    
    const canvasSheet = document.querySelector('.relative.shadow-2xl') as HTMLElement;
    if (!canvasSheet) return;

    const activeSelectedId = selectedItemId;
    canvasStore.setSelectedItemId(null);

    setTimeout(async () => {
      try {
        let dataUrl = '';
        const options = {
          pixelRatio: 2,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        };

        if (format === 'png') {
          dataUrl = await toPng(canvasSheet, options);
        } else if (format === 'jpeg') {
          dataUrl = await toJpeg(canvasSheet, { ...options, quality: 0.95 });
        } else {
          dataUrl = await toSvg(canvasSheet, options);
        }

        const link = document.createElement('a');
        link.download = `canvascraft-design.${format}`;
        link.href = dataUrl;
        link.click();

        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });

      } catch (err) {
        console.error('Export failed:', err);
        alert('Could not export design. If you uploaded high-res images, try smaller images.');
      } finally {
        if (activeSelectedId) {
          canvasStore.setSelectedItemId(activeSelectedId);
        }
      }
    }, 100);
  }

  // --- JSON SAVE / LOAD LOGIC ---
  function exportAsJSON() {
    showExportMenu = false;
    const projectData = {
      version: '1.0.0',
      canvas: {
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor
      },
      items: items
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'canvascraft-project.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImportJSON(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data && data.items && data.canvas) {
          canvasStore.loadProject(data.items, {
            width: data.canvas.width,
            height: data.canvas.height,
            backgroundColor: data.canvas.backgroundColor
          });

          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        } else {
          alert('Invalid CanvasCraft file format.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    target.value = '';
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- MAIN COMPONENT CONTAINER (Canva Light Mode Style) -->
<div class="h-screen w-full flex flex-col overflow-hidden bg-slate-100 font-sans text-slate-800">
  
  <!-- Header Bar (White background, light gray bottom border) -->
  <header class="h-16 w-full bg-white border-b border-slate-200 px-6 flex items-center justify-between z-40 select-none">
    <div class="flex items-center gap-3">
      <!-- Canva signature gradient badge -->
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7d2ae8] to-[#00c4cc] flex items-center justify-center shadow shadow-indigo-100">
        <Sparkles class="w-4 h-4 text-white" />
      </div>
      <div>
        <h1 id="app-title" class="font-display font-extrabold text-slate-900 text-base leading-none tracking-tight flex items-center gap-1.5">
          CanvasCraft 
          <span class="text-[9px] bg-[#7d2ae8]/10 text-[#7d2ae8] font-bold px-2 py-0.5 rounded border border-[#7d2ae8]/20 uppercase">Open-Source</span>
        </h1>
        <span class="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Online Graphic Design Tool</span>
      </div>
    </div>

    <!-- Center layout hint details (Minimal light style) -->
    <div class="hidden md:flex items-center gap-4 text-[11px] text-slate-400 font-medium">
      <div class="flex items-center gap-1">
        <kbd class="px-1.5 py-0.5 bg-slate-150 border border-slate-200 rounded font-mono text-[9px] text-slate-500">Ctrl+Z</kbd> Undo
      </div>
      <div class="flex items-center gap-1">
        <kbd class="px-1.5 py-0.5 bg-slate-150 border border-slate-200 rounded font-mono text-[9px] text-slate-500">Ctrl+D</kbd> Duplicate
      </div>
      <div class="flex items-center gap-1">
        <kbd class="px-1.5 py-0.5 bg-slate-150 border border-slate-200 rounded font-mono text-[9px] text-slate-500">Arrows</kbd> Move
      </div>
    </div>

    <!-- Right Actions: Load/Export -->
    <div class="flex items-center gap-2.5">
      <!-- Import JSON project -->
      <label 
        class="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-700 cursor-pointer transition-all active:scale-97 shadow-sm"
        title="Open CanvasCraft JSON Project file"
      >
        <Upload class="w-3.5 h-3.5 text-slate-500" />
        <span>Open Design</span>
        <input type="file" accept=".json" class="hidden" onchange={handleImportJSON} />
      </label>

      <!-- Export Dropdown -->
      <div class="relative">
        <button 
          onclick={() => showExportMenu = !showExportMenu}
          class="flex items-center gap-1.5 text-xs px-4 py-2 bg-[#7d2ae8] hover:bg-[#6820c7] text-white rounded-lg font-bold shadow-md shadow-violet-200 transition-all active:scale-97"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {#if showExportMenu}
          <!-- Backing Click Click-away block -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="fixed inset-0 z-40 bg-transparent" 
            onclick={() => showExportMenu = false}
          ></div>
          
          <!-- Popover list (Light theme shadow panel) -->
          <div class="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-2xl p-1.5 z-50 flex flex-col gap-0.5">
            <div class="px-3 py-1.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Download File</div>
            
            <button 
              onclick={() => exportDesign('png')}
              class="w-full flex items-center gap-3 p-2 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <FileImage class="w-4 h-4 text-violet-500" />
              <div>
                <p>PNG Image</p>
                <p class="text-[8px] text-slate-400">High-resolution portable format</p>
              </div>
            </button>

            <button 
              onclick={() => exportDesign('jpeg')}
              class="w-full flex items-center gap-3 p-2 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <FileImage class="w-4 h-4 text-pink-500" />
              <div>
                <p>JPEG Image</p>
                <p class="text-[8px] text-slate-400">Compressed, optimized file size</p>
              </div>
            </button>

            <button 
              onclick={() => exportDesign('svg')}
              class="w-full flex items-center gap-3 p-2 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <FileSpreadsheet class="w-4 h-4 text-teal-500" />
              <div>
                <p>SVG Vector File</p>
                <p class="text-[8px] text-slate-400">Scalable vector source file</p>
              </div>
            </button>

            <div class="h-px bg-slate-100 my-1"></div>
            <div class="px-3 py-1.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Editable Project</div>

            <button 
              onclick={exportAsJSON}
              class="w-full flex items-center gap-3 p-2 rounded-lg text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <FileCode class="w-4 h-4 text-amber-500" />
              <div>
                <p>CanvasCraft JSON File</p>
                <p class="text-[8px] text-slate-400">Export project template format</p>
              </div>
            </button>
          </div>
        {/if}
      </div>

    </div>
  </header>

  <!-- Editor Workspace Panels -->
  <div class="flex-1 flex overflow-hidden">
    
    <!-- Sidebar Drawer Left -->
    <Sidebar 
      bind:activeTab 
      bind:isDrawMode 
      bind:brushColor 
      bind:brushWidth 
    />

    <!-- Main Workspace Stage Center -->
    <main class="flex-1 flex flex-col overflow-hidden bg-slate-100">
      
      <!-- Toolbar context options -->
      <Toolbar />

      <!-- Interactive Canvas Area -->
      <Canvas 
        {isDrawMode}
        {brushColor}
        {brushWidth}
      />

    </main>
  </div>
</div>
