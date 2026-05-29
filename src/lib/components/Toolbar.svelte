<script lang="ts">
  import { canvasStore } from '../stores/canvasStore';
  import { 
    Bold, 
    Italic, 
    Underline, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    AlignJustify, 
    Trash2, 
    Copy, 
    Lock, 
    Unlock, 
    AlignStartVertical, 
    AlignStartHorizontal, 
    Undo, 
    Redo,
    Grid,
    PaintBucket
  } from '@lucide/svelte';
  import type { CanvasItem, TextItem, ShapeItem } from '../types';

  // Svelte 5 reactive bindings from store
  let canvasState = $derived($canvasStore);
  let selectedItem = $derived(
    canvasState.items.find(item => item.id === canvasState.selectedItemId)
  );

  // History status
  let historyStatus = $derived(canvasStore.getHistoryStatus());

  // Check if we can cast item types safely
  function isTextItem(item: CanvasItem): item is TextItem {
    return item.type === 'text';
  }

  function isShapeItem(item: CanvasItem): item is ShapeItem {
    return item.type === 'shape';
  }

  // Update properties on the selected item
  function updateSelected(updates: Partial<CanvasItem>) {
    if (!selectedItem) return;
    canvasStore.updateItem(selectedItem.id, updates);
  }

  // Alignments relative to canvas sheet
  function alignHorizontalCenter() {
    if (!selectedItem) return;
    canvasStore.commitHistory();
    const sheetWidth = canvasState.config.width;
    canvasStore.updateItem(selectedItem.id, {
      x: (sheetWidth - selectedItem.width) / 2
    });
  }

  function alignVerticalMiddle() {
    if (!selectedItem) return;
    canvasStore.commitHistory();
    const sheetHeight = canvasState.config.height;
    canvasStore.updateItem(selectedItem.id, {
      y: (sheetHeight - selectedItem.height) / 2
    });
  }

  // Quick preset backgrounds
  const BG_PRESETS = [
    { name: 'White', value: '#ffffff' },
    { name: 'Warm Cream', value: '#fdfbf7' },
    { name: 'Minimal Gray', value: '#f1f5f9' },
    { name: 'Sunset Linear', value: 'linear-gradient(135deg, #f97316, #ec4899)' },
    { name: 'Royal Indigo', value: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
    { name: 'Emerald Soft', value: 'linear-gradient(135deg, #34d399, #059669)' }
  ];

  // Font family options
  const FONTS = [
    { name: 'Inter (UI)', value: 'Inter' },
    { name: 'Outfit (Modern)', value: 'Outfit' },
    { name: 'Playfair (Elegant)', value: 'Playfair Display' },
    { name: 'Caveat (Handwritten)', value: 'Caveat' },
    { name: 'Montserrat (Accent)', value: 'Montserrat' }
  ];
</script>

<div class="h-16 w-full bg-white border-b border-slate-200 px-6 flex items-center justify-between text-slate-700 select-none">
  
  <!-- Left Side: History Undo/Redo & General Actions -->
  <div class="flex items-center gap-1.5">
    <button 
      onclick={() => canvasStore.undo()}
      disabled={!historyStatus.canUndo}
      class="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all"
      title="Undo (Ctrl+Z)"
    >
      <Undo class="w-3.5 h-3.5" />
    </button>
    <button 
      onclick={() => canvasStore.redo()}
      disabled={!historyStatus.canRedo}
      class="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all"
      title="Redo (Ctrl+Y)"
    >
      <Redo class="w-3.5 h-3.5" />
    </button>
    
    <div class="h-4 w-px bg-slate-200 mx-2"></div>
    
    <button 
      onclick={() => canvasStore.clearCanvas()}
      disabled={canvasState.items.length === 0}
      class="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-650 disabled:opacity-30 disabled:pointer-events-none font-semibold transition-all"
    >
      Clear Canvas
    </button>
  </div>

  <!-- Center Side: Selected Item Context Controls -->
  <div class="flex-1 flex justify-center px-4">
    {#if selectedItem}
      <div class="flex items-center gap-2.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
        
        <!-- ELEMENT GENERAL CONTROLS -->
        <span class="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold uppercase">{selectedItem.type}</span>
        
        <button 
          onclick={() => canvasStore.duplicateItem(selectedItem.id)}
          class="p-1 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
          title="Duplicate Element (Ctrl+D)"
        >
          <Copy class="w-3.5 h-3.5" />
        </button>

        <button 
          onclick={() => canvasStore.updateItem(selectedItem.id, { locked: !selectedItem.locked })}
          class="p-1 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
          title={selectedItem.locked ? "Unlock Element" : "Lock Element"}
        >
          {#if selectedItem.locked}
            <Lock class="w-3.5 h-3.5 text-amber-600" />
          {:else}
            <Unlock class="w-3.5 h-3.5" />
          {/if}
        </button>

        <button 
          onclick={() => canvasStore.deleteItem(selectedItem.id)}
          class="p-1 rounded hover:bg-red-100 hover:text-red-650 transition-colors"
          title="Delete Element (Delete)"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>

        <div class="h-4 w-px bg-slate-200 mx-1"></div>

        <!-- ALIGN TO PAGE -->
        {#if !selectedItem.locked}
          <button 
            onclick={alignHorizontalCenter}
            class="p-1 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors text-[11px] font-bold flex items-center gap-1"
            title="Align Center Horizontally"
          >
            <AlignStartVertical class="w-3.5 h-3.5" />
            H-Center
          </button>
          <button 
            onclick={alignVerticalMiddle}
            class="p-1 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors text-[11px] font-bold flex items-center gap-1"
            title="Align Middle Vertically"
          >
            <AlignStartHorizontal class="w-3.5 h-3.5" />
            V-Middle
          </button>
          <div class="h-4 w-px bg-slate-200 mx-1"></div>
        {/if}

        <!-- 1. TEXT SPECIFIC CONTROLS -->
        {#if isTextItem(selectedItem)}
          {@const txtItem = selectedItem}
          
          <!-- Font Family -->
          <select 
            value={txtItem.fontFamily}
            onchange={(e) => updateSelected({ fontFamily: (e.target as HTMLSelectElement).value })}
            disabled={txtItem.locked}
            class="bg-white border border-slate-200 text-xs px-2 py-0.5 rounded outline-none cursor-pointer text-slate-800"
          >
            {#each FONTS as font}
              <option value={font.value}>{font.name}</option>
            {/each}
          </select>

          <!-- Font Size -->
          <div class="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
            <button 
              onclick={() => updateSelected({ fontSize: Math.max(8, txtItem.fontSize - 2) })}
              disabled={txtItem.locked}
              class="px-1.5 py-0.5 hover:bg-slate-100 text-xs font-bold text-slate-650"
            >
              -
            </button>
            <input 
              type="number" 
              value={txtItem.fontSize}
              onchange={(e) => updateSelected({ fontSize: Math.max(8, parseInt((e.target as HTMLInputElement).value) || 12) })}
              disabled={txtItem.locked}
              class="w-8 text-center bg-transparent text-xs text-slate-800 border-0 outline-none p-0"
            />
            <button 
              onclick={() => updateSelected({ fontSize: Math.min(200, txtItem.fontSize + 2) })}
              disabled={txtItem.locked}
              class="px-1.5 py-0.5 hover:bg-slate-100 text-xs font-bold text-slate-650"
            >
              +
            </button>
          </div>

          <!-- Color Picker -->
          <div class="flex items-center">
            <input 
              type="color" 
              value={txtItem.color}
              oninput={(e) => updateSelected({ color: (e.target as HTMLInputElement).value })}
              disabled={txtItem.locked}
              class="w-5 h-5 border-0 rounded cursor-pointer bg-transparent"
              title="Text Color"
            />
          </div>

          <!-- Bold, Italic, Underline toggles -->
          <div class="flex items-center bg-white rounded border border-slate-200 overflow-hidden">
            <button 
              onclick={() => updateSelected({ fontWeight: txtItem.fontWeight === 'bold' ? 'normal' : 'bold' })}
              disabled={txtItem.locked}
              class="p-1 hover:bg-slate-100 {txtItem.fontWeight === 'bold' ? 'text-violet-600 bg-violet-50/50' : 'text-slate-500'}"
              title="Bold"
            >
              <Bold class="w-3 h-3" />
            </button>
            <button 
              onclick={() => updateSelected({ fontStyle: txtItem.fontStyle === 'italic' ? 'normal' : 'italic' })}
              disabled={txtItem.locked}
              class="p-1 hover:bg-slate-100 {txtItem.fontStyle === 'italic' ? 'text-violet-600 bg-violet-50/50' : 'text-slate-500'}"
              title="Italic"
            >
              <Italic class="w-3 h-3" />
            </button>
            <button 
              onclick={() => updateSelected({ textDecoration: txtItem.textDecoration === 'underline' ? 'none' : 'underline' })}
              disabled={txtItem.locked}
              class="p-1 hover:bg-slate-100 {txtItem.textDecoration === 'underline' ? 'text-violet-600 bg-violet-50/50' : 'text-slate-500'}"
              title="Underline"
            >
              <Underline class="w-3 h-3" />
            </button>
          </div>

          <!-- Alignments -->
          <div class="flex items-center bg-white rounded border border-slate-200 overflow-hidden">
            <button 
              onclick={() => updateSelected({ align: 'left' })}
              disabled={txtItem.locked}
              class="p-1 hover:bg-slate-100 {txtItem.align === 'left' ? 'text-violet-600 bg-violet-50/50' : 'text-slate-500'}"
            >
              <AlignLeft class="w-3 h-3" />
            </button>
            <button 
              onclick={() => updateSelected({ align: 'center' })}
              disabled={txtItem.locked}
              class="p-1 hover:bg-slate-100 {txtItem.align === 'center' ? 'text-violet-600 bg-violet-50/50' : 'text-slate-500'}"
            >
              <AlignCenter class="w-3 h-3" />
            </button>
            <button 
              onclick={() => updateSelected({ align: 'right' })}
              disabled={txtItem.locked}
              class="p-1 hover:bg-slate-100 {txtItem.align === 'right' ? 'text-violet-600 bg-violet-50/50' : 'text-slate-500'}"
            >
              <AlignRight class="w-3 h-3" />
            </button>
          </div>
        {/if}

        <!-- 2. SHAPE SPECIFIC CONTROLS -->
        {#if isShapeItem(selectedItem)}
          {@const shpItem = selectedItem}

          <!-- Fill Color Picker -->
          <div class="flex items-center gap-1.5" title="Fill Color">
            <input 
              type="color" 
              value={shpItem.fill === 'transparent' ? '#ffffff' : shpItem.fill}
              oninput={(e) => updateSelected({ fill: (e.target as HTMLInputElement).value })}
              disabled={shpItem.locked}
              class="w-5 h-5 border-0 rounded cursor-pointer bg-transparent"
            />
            <button 
              onclick={() => updateSelected({ fill: shpItem.fill === 'transparent' ? '#7d2ae8' : 'transparent' })}
              disabled={shpItem.locked}
              class="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 hover:bg-slate-100 font-bold"
            >
              {shpItem.fill === 'transparent' ? 'Solid' : 'Transparent'}
            </button>
          </div>

          <!-- Stroke Options -->
          <div class="flex items-center gap-1.5">
            <span class="text-[9px] text-slate-500 font-bold uppercase">Border</span>
            <input 
              type="color" 
              value={shpItem.strokeColor === 'transparent' ? '#ffffff' : shpItem.strokeColor}
              oninput={(e) => updateSelected({ strokeColor: (e.target as HTMLInputElement).value })}
              disabled={shpItem.locked}
              class="w-5 h-5 border-0 rounded cursor-pointer bg-transparent"
            />
            
            <input 
              type="range" 
              min="0" 
              max="20" 
              value={shpItem.strokeWidth}
              oninput={(e) => updateSelected({ strokeWidth: parseInt((e.target as HTMLInputElement).value) })}
              disabled={shpItem.locked}
              class="w-14 accent-violet-600 cursor-pointer"
            />
          </div>

          <!-- Corner Radius (only for Rect) -->
          {#if shpItem.shapeType === 'rect'}
            <div class="flex items-center gap-1.5">
              <span class="text-[9px] text-slate-500 font-bold uppercase">Corner</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={shpItem.borderRadius}
                oninput={(e) => updateSelected({ borderRadius: parseInt((e.target as HTMLInputElement).value) })}
                disabled={shpItem.locked}
                class="w-14 accent-violet-600 cursor-pointer"
              />
            </div>
          {/if}
        {/if}

        <!-- 3. IMAGE / OTHER CONTROLS (OPACITY) -->
        {#if selectedItem.type === 'image' || selectedItem.type === 'drawing'}
          <div class="flex items-center gap-2">
            <span class="text-[9px] text-slate-500 font-bold uppercase">Opacity</span>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05"
              value={selectedItem.opacity}
              oninput={(e) => updateSelected({ opacity: parseFloat((e.target as HTMLInputElement).value) })}
              disabled={selectedItem.locked}
              class="w-20 accent-violet-600 cursor-pointer"
            />
            <span class="text-[9px] font-bold font-mono text-slate-500">{Math.round(selectedItem.opacity * 100)}%</span>
          </div>
        {/if}

      </div>
    {:else}
      <!-- PAGE / CANVAS SIZE AND BACKGROUND CONTROLS (IF NO ITEM IS SELECTED) -->
      <div class="flex items-center gap-4">
        
        <!-- Sheet Dimensions -->
        <div class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <Grid class="w-3.5 h-3.5 text-slate-400" />
          <div class="flex items-center text-[11px] font-bold gap-1 text-slate-700">
            <span>Dimensions:</span>
            <input 
              type="number" 
              value={canvasState.config.width}
              onchange={(e) => canvasStore.updateConfig({ width: Math.max(100, parseInt((e.target as HTMLInputElement).value) || 600) })}
              class="w-11 bg-white border border-slate-200 text-center px-0.5 rounded outline-none text-slate-800"
            />
            <span class="text-slate-400">×</span>
            <input 
              type="number" 
              value={canvasState.config.height}
              onchange={(e) => canvasStore.updateConfig({ height: Math.max(100, parseInt((e.target as HTMLInputElement).value) || 600) })}
              class="w-11 bg-white border border-slate-200 text-center px-0.5 rounded outline-none text-slate-800"
            />
            <span class="text-slate-400">px</span>
          </div>
        </div>

        <!-- Sheet Background picker -->
        <div class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          <PaintBucket class="w-3.5 h-3.5 text-slate-400" />
          <span class="text-[11px] font-bold text-slate-700">Canvas Fill:</span>
          
          <input 
            type="color" 
            value={canvasState.config.backgroundColor.startsWith('#') ? canvasState.config.backgroundColor : '#ffffff'}
            oninput={(e) => canvasStore.updateConfig({ backgroundColor: (e.target as HTMLInputElement).value })}
            class="w-5 h-5 border-0 rounded cursor-pointer bg-transparent"
          />

          <!-- Quick Background Presets dropdown/selector -->
          <div class="flex gap-1 ml-1 items-center">
            {#each BG_PRESETS.slice(0, 3) as preset}
              <button 
                onclick={() => canvasStore.updateConfig({ backgroundColor: preset.value })}
                style="background: {preset.value}" 
                class="w-4 h-4 rounded-full border border-slate-300 transition-transform hover:scale-110 active:scale-95"
                title={preset.name}
              ></button>
            {/each}
            
            <select 
              value={canvasState.config.backgroundColor}
              onchange={(e) => canvasStore.updateConfig({ backgroundColor: (e.target as HTMLSelectElement).value })}
              class="bg-white border border-slate-200 text-[10px] px-1.5 py-0.5 rounded outline-none cursor-pointer text-slate-700"
            >
              <option value="" disabled>Presets</option>
              {#each BG_PRESETS as preset}
                <option value={preset.value}>{preset.name}</option>
              {/each}
            </select>
          </div>

        </div>

      </div>
    {/if}
  </div>

  <!-- Right Side: Zoom indicator -->
  <div class="flex items-center gap-2">
    <div class="text-[11px] font-bold text-slate-450 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
      Scale: {Math.round(canvasState.config.zoom * 100)}%
    </div>
  </div>

</div>
