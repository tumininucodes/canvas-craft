<script lang="ts">
  import { canvasStore } from '../stores/canvasStore';
  import type { CanvasItem, TextItem, ShapeItem, ImageItem, DrawingItem } from '../types';
  import { ZoomIn, ZoomOut, Maximize } from '@lucide/svelte';

  // Svelte 5 reactive bindings from Sidebar
  let { isDrawMode = false, brushColor = '#8b5cf6', brushWidth = 8 } = $props();

  // Subscribe to canvasStore
  let canvasState = $derived($canvasStore);
  let items = $derived(canvasState.items);
  let selectedItemId = $derived(canvasState.selectedItemId);
  let config = $derived(canvasState.config);

  // References
  let canvasSheetRef: HTMLDivElement | null = $state(null);
  let workspaceRef: HTMLDivElement | null = $state(null);

  // Inline text editing state
  let editingTextId: string | null = $state(null);
  let editingTextContent = $state('');

  // Guide lines state (snapping lines)
  let activeGuideLines: { x: number | null; y: number | null } = $state({ x: null, y: null });

  // Brush drawing state
  let activeDrawingItemDocId: string | null = $state(null);

  // Convert client mouse coords to canvas relative coords
  function getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    if (!canvasSheetRef) return { x: 0, y: 0 };
    const rect = canvasSheetRef.getBoundingClientRect();
    const x = (clientX - rect.left) / config.zoom;
    const y = (clientY - rect.top) / config.zoom;
    return { x, y };
  }

  // --- DRAW MODE MOUSE EVENTS ---
  let isMouseDrawing = false;

  function handleCanvasMouseDown(e: MouseEvent) {
    if (!isDrawMode) {
      // If we clicked on the background of the canvas sheet, deselect current item
      if (e.target === canvasSheetRef) {
        canvasStore.setSelectedItemId(null);
      }
      return;
    }

    e.preventDefault();
    isMouseDrawing = true;
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Create a new drawing item spanning the whole canvas
    const id = canvasStore.addItem({
      type: 'drawing',
      name: 'Freehand Sketch',
      x: 0,
      y: 0,
      width: config.width,
      height: config.height,
      rotation: 0,
      opacity: 1,
      locked: false,
      points: [coords],
      strokeColor: brushColor,
      strokeWidth: brushWidth
    });
    activeDrawingItemDocId = id;
  }

  function handleCanvasMouseMove(e: MouseEvent) {
    if (!isDrawMode || !isMouseDrawing || !activeDrawingItemDocId) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Update drawing points
    const drawItem = items.find(item => item.id === activeDrawingItemDocId) as DrawingItem;
    if (drawItem) {
      const updatedPoints = [...drawItem.points, coords];
      canvasStore.updateItem(activeDrawingItemDocId, { points: updatedPoints });
    }
  }

  function handleCanvasMouseUp() {
    isMouseDrawing = false;
    activeDrawingItemDocId = null;
  }

  // Generate SVG Path from freehand points
  function generateSvgPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  // --- DRAG & DROP HANDLING ---
  function handleCanvasDrop(e: DragEvent) {
    e.preventDefault();
    if (isDrawMode) return;

    // Convert mouse client coordinates to canvas relative coordinates
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const dropX = coords.x;
    const dropY = coords.y;

    // 1. Handle files dropped directly from computer desktop (e.g. PNGs, JPEGs, SVGs)
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const src = readerEvent.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const width = 200;
            const height = 200 / aspectRatio;
            canvasStore.addItem({
              type: 'image',
              name: 'Dropped Image',
              x: dropX - width / 2,
              y: dropY - height / 2,
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
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    // 2. Handle items dragged from the Sidebar panel
    const itemType = e.dataTransfer?.getData('item-type');
    const itemVal = e.dataTransfer?.getData('item-val');

    if (!itemType || !itemVal) return;

    if (itemType === 'shape') {
      const shapeType = itemVal as ShapeItem['shapeType'];
      canvasStore.addItem({
        type: 'shape',
        name: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
        shapeType,
        fill: '#7d2ae8',
        strokeColor: 'transparent',
        strokeWidth: 0,
        borderRadius: shapeType === 'rect' ? 8 : 0,
        x: dropX - 50,
        y: dropY - 50,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false
      });
    } else if (itemType === 'text') {
      let textProps: Omit<TextItem, 'id'>;
      if (itemVal === 'heading') {
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
          x: dropX - 150,
          y: dropY - 30,
          width: 300,
          height: 60,
          rotation: 0,
          opacity: 1,
          locked: false
        };
      } else if (itemVal === 'subheading') {
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
          x: dropX - 125,
          y: dropY - 20,
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
          x: dropX - 100,
          y: dropY - 50,
          width: 200,
          height: 100,
          rotation: 0,
          opacity: 1,
          locked: false
        };
      }
      canvasStore.addItem(textProps);
    } else if (itemType === 'image') {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const width = 200;
        const height = 200 / aspectRatio;
        canvasStore.addItem({
          type: 'image',
          name: 'Dropped Image',
          x: dropX - width / 2,
          y: dropY - height / 2,
          width,
          height,
          rotation: 0,
          opacity: 1,
          locked: false,
          src: itemVal,
          aspectRatio
        });
      };
      img.src = itemVal;
    }
  }

  // --- DRAG / RESIZE / ROTATE MATHS ---
  let dragStartMouseX = 0;
  let dragStartMouseY = 0;
  let dragStartItemX = 0;
  let dragStartItemY = 0;
  let dragStartItemWidth = 0;
  let dragStartItemHeight = 0;
  let dragStartRotation = 0;

  function startDrag(item: CanvasItem, e: MouseEvent) {
    if (item.locked || isDrawMode) return;
    e.stopPropagation();
    
    // Select item
    canvasStore.setSelectedItemId(item.id);
    
    // Record history state on drag start
    canvasStore.commitHistory();

    dragStartMouseX = e.clientX;
    dragStartMouseY = e.clientY;
    dragStartItemX = item.x;
    dragStartItemY = item.y;

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }

  function handleDragMove(e: MouseEvent) {
    const selectedItem = items.find(i => i.id === selectedItemId);
    if (!selectedItem) return;

    const dx = (e.clientX - dragStartMouseX) / config.zoom;
    const dy = (e.clientY - dragStartMouseY) / config.zoom;

    let targetX = dragStartItemX + dx;
    let targetY = dragStartItemY + dy;

    // Snapping calculations (snap to centers and edges of canvas)
    let snapX: number | null = null;
    let snapY: number | null = null;
    const snapThreshold = 6; // pixels

    const canvasCenterX = config.width / 2;
    const canvasCenterY = config.height / 2;

    const itemWidth = selectedItem.width;
    const itemHeight = selectedItem.height;

    // 1. Horizontal Snapping (X-axis snap)
    // Snap item left edge
    if (Math.abs(targetX) < snapThreshold) {
      targetX = 0;
      snapX = 0;
    }
    // Snap item center to canvas center
    else if (Math.abs((targetX + itemWidth / 2) - canvasCenterX) < snapThreshold) {
      targetX = canvasCenterX - itemWidth / 2;
      snapX = canvasCenterX;
    }
    // Snap item right edge to canvas right edge
    else if (Math.abs((targetX + itemWidth) - config.width) < snapThreshold) {
      targetX = config.width - itemWidth;
      snapX = config.width;
    }

    // 2. Vertical Snapping (Y-axis snap)
    // Snap item top edge
    if (Math.abs(targetY) < snapThreshold) {
      targetY = 0;
      snapY = 0;
    }
    // Snap item center to canvas center
    else if (Math.abs((targetY + itemHeight / 2) - canvasCenterY) < snapThreshold) {
      targetY = canvasCenterY - itemHeight / 2;
      snapY = canvasCenterY;
    }
    // Snap item bottom edge to canvas bottom
    else if (Math.abs((targetY + itemHeight) - config.height) < snapThreshold) {
      targetY = config.height - itemHeight;
      snapY = config.height;
    }

    // Update guidelines visual state
    activeGuideLines = { x: snapX, y: snapY };

    // Update item position
    canvasStore.updateItem(selectedItem.id, { x: targetX, y: targetY });
  }

  function handleDragEnd() {
    activeGuideLines = { x: null, y: null };
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  }

  // RESIZING
  function startResize(item: CanvasItem, handle: string, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    canvasStore.commitHistory();

    dragStartMouseX = e.clientX;
    dragStartMouseY = e.clientY;
    dragStartItemX = item.x;
    dragStartItemY = item.y;
    dragStartItemWidth = item.width;
    dragStartItemHeight = item.height;

    const resizeHandler = (moveEvent: MouseEvent) => {
      handleResizeMove(item, handle, moveEvent);
    };

    const resizeEndHandler = () => {
      window.removeEventListener('mousemove', resizeHandler);
      window.removeEventListener('mouseup', resizeEndHandler);
    };

    window.addEventListener('mousemove', resizeHandler);
    window.addEventListener('mouseup', resizeEndHandler);
  }

  function handleResizeMove(item: CanvasItem, handle: string, e: MouseEvent) {
    const rawDx = (e.clientX - dragStartMouseX) / config.zoom;
    const rawDy = (e.clientY - dragStartMouseY) / config.zoom;

    // Rotate mouse deltas by opposite of item rotation to make calculations align with local axes
    const rad = (item.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // local mouse delta
    const dx = rawDx * cos + rawDy * sin;
    const dy = -rawDx * sin + rawDy * cos;

    let newWidth = dragStartItemWidth;
    let newHeight = dragStartItemHeight;
    let deltaX = 0;
    let deltaY = 0;

    // Direction switches
    if (handle.includes('e')) {
      newWidth = Math.max(15, dragStartItemWidth + dx);
    }
    if (handle.includes('w')) {
      newWidth = Math.max(15, dragStartItemWidth - dx);
      deltaX = dragStartItemWidth - newWidth;
    }
    if (handle.includes('s')) {
      newHeight = Math.max(15, dragStartItemHeight + dy);
    }
    if (handle.includes('n')) {
      newHeight = Math.max(15, dragStartItemHeight - dy);
      deltaY = dragStartItemHeight - newHeight;
    }

    // Handle aspect ratio lock for Images
    if (item.type === 'image') {
      const img = item as ImageItem;
      if (handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se') {
        // Uniform resize based on width change
        if (handle.includes('e') || handle.includes('w')) {
          newHeight = newWidth / img.aspectRatio;
        } else {
          newWidth = newHeight * img.aspectRatio;
        }
        
        // Recalculate deltas for top-left changes
        if (handle.includes('n')) {
          deltaY = dragStartItemHeight - newHeight;
        }
        if (handle.includes('w')) {
          deltaX = dragStartItemWidth - newWidth;
        }
      }
    }

    // Convert local top-left delta back to global canvas space based on item rotation
    const globalDeltaX = deltaX * cos - deltaY * sin;
    const globalDeltaY = deltaX * sin + deltaY * cos;

    canvasStore.updateItem(item.id, {
      width: newWidth,
      height: newHeight,
      x: dragStartItemX + globalDeltaX,
      y: dragStartItemY + globalDeltaY
    });
  }

  // ROTATING
  function startRotate(item: CanvasItem, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    canvasStore.commitHistory();

    const rect = canvasSheetRef!.getBoundingClientRect();
    // Center of element in screen coords
    const itemCenterX = rect.left + (item.x + item.width / 2) * config.zoom;
    const itemCenterY = rect.top + (item.y + item.height / 2) * config.zoom;

    const rotateHandler = (moveEvent: MouseEvent) => {
      const angleRad = Math.atan2(moveEvent.clientY - itemCenterY, moveEvent.clientX - itemCenterX);
      // Convert to degrees and subtract 90 since the handle sits at top (90deg offset)
      let angleDeg = (angleRad * 180) / Math.PI - 90;
      
      // Snap to 45 deg increments if Shift is held
      if (moveEvent.shiftKey) {
        angleDeg = Math.round(angleDeg / 45) * 45;
      }

      canvasStore.updateItem(item.id, { rotation: (angleDeg + 360) % 360 });
    };

    const rotateEndHandler = () => {
      window.removeEventListener('mousemove', rotateHandler);
      window.removeEventListener('mouseup', rotateEndHandler);
    };

    window.addEventListener('mousemove', rotateHandler);
    window.addEventListener('mouseup', rotateEndHandler);
  }

  // --- TEXT INLINE EDITING ---
  function doubleClickText(item: TextItem, e: MouseEvent) {
    e.stopPropagation();
    if (item.locked) return;
    editingTextId = item.id;
    editingTextContent = item.text;
  }

  function blurTextEdit(item: TextItem) {
    canvasStore.commitHistory();
    canvasStore.updateItem(item.id, { text: editingTextContent });
    editingTextId = null;
  }

  // ZOOM CONTROLS
  function zoomIn() {
    canvasStore.updateConfig({ zoom: Math.min(2.0, config.zoom + 0.1) });
  }

  function zoomOut() {
    canvasStore.updateConfig({ zoom: Math.max(0.3, config.zoom - 0.1) });
  }

  function zoomFit() {
    canvasStore.updateConfig({ zoom: 0.9, panX: 0, panY: 0 });
  }
</script>

<div 
  bind:this={workspaceRef}
  class="flex-1 overflow-auto checkerboard-bg flex items-center justify-center p-12 relative no-select"
  style="height: calc(100vh - 64px - 64px);"
>
  
  <!-- Canvas Scale Wrapper -->
  <div 
    bind:this={canvasSheetRef}
    class="relative shadow-2xl transition-shadow duration-300 bg-white"
    style="
      width: {config.width}px; 
      height: {config.height}px; 
      background: {config.backgroundColor}; 
      transform: scale({config.zoom}); 
      transform-origin: center center;
      cursor: {isDrawMode ? 'crosshair' : 'default'}
    "
    onmousedown={handleCanvasMouseDown}
    onmousemove={handleCanvasMouseMove}
    onmouseup={handleCanvasMouseUp}
    ondragover={(e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; }}
    ondrop={handleCanvasDrop}
  >
    
    <!-- Render all Canvas Elements -->
    {#each items as item, index (item.id)}
      
      <!-- Positioned Element container -->
      <div 
        class="absolute select-none group/item {item.locked ? 'pointer-events-none' : ''} {selectedItemId === item.id ? '' : 'hover:outline hover:outline-[1.5px] hover:outline-[#00c4cc] cursor-pointer'}"
        style="
          left: {item.x}px; 
          top: {item.y}px; 
          width: {item.width}px; 
          height: {item.height}px; 
          transform: rotate({item.rotation}deg); 
          opacity: {item.opacity};
          z-index: {index + 1};
          pointer-events: {isDrawMode ? 'none' : 'auto'}
        "
        onmousedown={(e) => startDrag(item, e)}
      >
        
        <!-- 1. TEXT ITEM RENDERING -->
        {#if item.type === 'text'}
          {@const txtItem = item as TextItem}
          <div class="w-full h-full relative flex items-center justify-center">
            {#if editingTextId === item.id}
              <textarea 
                bind:value={editingTextContent}
                onblur={() => blurTextEdit(txtItem)}
                class="w-full h-full bg-transparent border-0 outline-none text-center resize-none p-0 no-select overflow-hidden"
                style="
                  font-size: {txtItem.fontSize}px; 
                  font-family: {txtItem.fontFamily}; 
                  color: {txtItem.color}; 
                  font-weight: {txtItem.fontWeight}; 
                  font-style: {txtItem.fontStyle}; 
                  text-decoration: {txtItem.textDecoration};
                  text-align: {txtItem.align};
                  line-height: {txtItem.lineHeight};
                "
                autoFocus={true}
              ></textarea>
            {:else}
              <div 
                ondblclick={(e) => doubleClickText(txtItem, e)}
                class="w-full break-words outline-none select-none pointer-events-auto whitespace-pre-wrap"
                style="
                  font-size: {txtItem.fontSize}px; 
                  font-family: {txtItem.fontFamily}; 
                  color: {txtItem.color}; 
                  font-weight: {txtItem.fontWeight}; 
                  font-style: {txtItem.fontStyle}; 
                  text-decoration: {txtItem.textDecoration};
                  text-align: {txtItem.align};
                  line-height: {txtItem.lineHeight};
                  cursor: text;
                "
              >
                {txtItem.text}
              </div>
            {/if}
          </div>
        {/if}

        <!-- 2. SHAPE ITEM RENDERING -->
        {#if item.type === 'shape'}
          {@const shpItem = item as ShapeItem}
          <svg class="w-full h-full overflow-visible pointer-events-none">
            {#if shpItem.shapeType === 'rect'}
              <rect 
                x={shpItem.strokeWidth / 2}
                y={shpItem.strokeWidth / 2}
                width={shpItem.width - shpItem.strokeWidth}
                height={shpItem.height - shpItem.strokeWidth}
                fill={shpItem.fill}
                stroke={shpItem.strokeColor}
                stroke-width={shpItem.strokeWidth}
                rx={shpItem.borderRadius}
                ry={shpItem.borderRadius}
              />
            {:else if shpItem.shapeType === 'circle'}
              {@const cx = shpItem.width / 2}
              {@const cy = shpItem.height / 2}
              {@const r = Math.min(shpItem.width, shpItem.height) / 2 - shpItem.strokeWidth / 2}
              <circle 
                {cx} 
                {cy} 
                {r}
                fill={shpItem.fill}
                stroke={shpItem.strokeColor}
                stroke-width={shpItem.strokeWidth}
              />
            {:else if shpItem.shapeType === 'triangle'}
              <polygon 
                points="
                  {shpItem.width / 2},{shpItem.strokeWidth} 
                  {shpItem.strokeWidth},{shpItem.height - shpItem.strokeWidth} 
                  {shpItem.width - shpItem.strokeWidth},{shpItem.height - shpItem.strokeWidth}
                "
                fill={shpItem.fill}
                stroke={shpItem.strokeColor}
                stroke-width={shpItem.strokeWidth}
              />
            {:else if shpItem.shapeType === 'star'}
              <!-- Simple 5 point star polygon calculated on bounding box -->
              <polygon 
                points="
                  {shpItem.width * 0.5},{shpItem.strokeWidth}
                  {shpItem.width * 0.62},{shpItem.height * 0.38}
                  {shpItem.width - shpItem.strokeWidth},{shpItem.height * 0.38}
                  {shpItem.width * 0.70},{shpItem.height * 0.62}
                  {shpItem.width * 0.81},{shpItem.height - shpItem.strokeWidth}
                  {shpItem.width * 0.5},{shpItem.height * 0.78}
                  {shpItem.width * 0.19},{shpItem.height - shpItem.strokeWidth}
                  {shpItem.width * 0.30},{shpItem.height * 0.62}
                  {shpItem.strokeWidth},{shpItem.height * 0.38}
                  {shpItem.width * 0.38},{shpItem.strokeWidth * 0.38}
                "
                fill={shpItem.fill}
                stroke={shpItem.strokeColor}
                stroke-width={shpItem.strokeWidth}
              />
            {:else if shpItem.shapeType === 'pentagon'}
              <polygon 
                points="
                  {shpItem.width * 0.5},{shpItem.strokeWidth}
                  {shpItem.width - shpItem.strokeWidth},{shpItem.height * 0.38}
                  {shpItem.width * 0.82},{shpItem.height - shpItem.strokeWidth}
                  {shpItem.width * 0.18},{shpItem.height - shpItem.strokeWidth}
                  {shpItem.strokeWidth},{shpItem.height * 0.38}
                "
                fill={shpItem.fill}
                stroke={shpItem.strokeColor}
                stroke-width={shpItem.strokeWidth}
              />
            {:else if shpItem.shapeType === 'hexagon'}
              <polygon 
                points="
                  {shpItem.width * 0.25},{shpItem.strokeWidth}
                  {shpItem.width * 0.75},{shpItem.strokeWidth}
                  {shpItem.width - shpItem.strokeWidth},{shpItem.height * 0.5}
                  {shpItem.width * 0.75},{shpItem.height - shpItem.strokeWidth}
                  {shpItem.width * 0.25},{shpItem.height - shpItem.strokeWidth}
                  {shpItem.strokeWidth},{shpItem.height * 0.5}
                "
                fill={shpItem.fill}
                stroke={shpItem.strokeColor}
                stroke-width={shpItem.strokeWidth}
              />
            {/if}
          </svg>
        {/if}

        <!-- 3. IMAGE ITEM RENDERING -->
        {#if item.type === 'image'}
          {@const imgItem = item as ImageItem}
          <img 
            src={imgItem.src} 
            alt={imgItem.name}
            class="w-full h-full object-fill rounded-sm select-none pointer-events-none"
          />
        {/if}

        <!-- 4. DRAWING ITEM RENDERING -->
        {#if item.type === 'drawing'}
          {@const drwItem = item as DrawingItem}
          <svg class="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <path 
              d={generateSvgPath(drwItem.points)}
              fill="none"
              stroke={drwItem.strokeColor}
              stroke-width={drwItem.strokeWidth}
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        {/if}

        <!-- 5. SELECTION OUTLINE BORDER & HANDLES (RENDERED IF ITEM IS SELECTED) -->
        {#if selectedItemId === item.id && !isDrawMode}
          <!-- Border box wrapper -->
          <div class="absolute -inset-[2px] border-2 border-[#00c4cc] rounded-sm pointer-events-none z-50">
            {#if !item.locked}
              <!-- Corners handles (nw, ne, se, sw) -->
              <div 
                class="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full cursor-nwse-resize pointer-events-auto"
                onmousedown={(e) => startResize(item, 'nw', e)}
              ></div>
              <div 
                class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full cursor-nesw-resize pointer-events-auto"
                onmousedown={(e) => startResize(item, 'ne', e)}
              ></div>
              <div 
                class="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full cursor-nwse-resize pointer-events-auto"
                onmousedown={(e) => startResize(item, 'se', e)}
              ></div>
              <div 
                class="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#00c4cc] rounded-full cursor-nesw-resize pointer-events-auto"
                onmousedown={(e) => startResize(item, 'sw', e)}
              ></div>

              <!-- Edges resizing handles (n, e, s, w) (not needed to force aspect ratio for drawing/text) -->
              <div 
                class="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-4 bg-white border-2 border-[#00c4cc] rounded-sm cursor-ew-resize pointer-events-auto"
                onmousedown={(e) => startResize(item, 'e', e)}
              ></div>
              <div 
                class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-4 bg-white border-2 border-[#00c4cc] rounded-sm cursor-ew-resize pointer-events-auto"
                onmousedown={(e) => startResize(item, 'w', e)}
              ></div>
              <div 
                class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border-2 border-[#00c4cc] rounded-sm cursor-ns-resize pointer-events-auto"
                onmousedown={(e) => startResize(item, 's', e)}
              ></div>
              <div 
                class="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border-2 border-[#00c4cc] rounded-sm cursor-ns-resize pointer-events-auto"
                onmousedown={(e) => startResize(item, 'n', e)}
              ></div>

              <!-- Rotation Handle sitting below bottom boundary -->
              <div 
                class="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
                onmousedown={(e) => startRotate(item, e)}
              >
                <!-- Line connector -->
                <div class="w-0.5 h-4 bg-[#00c4cc]"></div>
                <!-- Rotation Knob -->
                <div class="w-6 h-6 bg-white border-2 border-[#00c4cc] rounded-full flex items-center justify-center shadow-md hover:bg-[#e6f9fa] transition-colors">
                  <!-- Rotate symbol -->
                  <svg class="w-3.5 h-3.5 text-[#008c91]" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
              </div>
            {/if}
          </div>
        {/if}

      </div>
    {/each}

    <!-- ALIGNMENT GUIDELINE DASHES (OVERLAY ON TOP OF CANVAS ELEMENTS DURING DRAG) -->
    {#if activeGuideLines.x !== null}
      <div 
        class="absolute top-0 bottom-0 border-l border-dashed border-[#7d2ae8] pointer-events-none z-50"
        style="left: {activeGuideLines.x}px"
      ></div>
    {/if}
    {#if activeGuideLines.y !== null}
      <div 
        class="absolute left-0 right-0 border-t border-dashed border-[#7d2ae8] pointer-events-none z-50"
        style="top: {activeGuideLines.y}px"
      ></div>
    {/if}

  </div>

  <!-- Absolute Floating Canvas Zoom Actions Floating Bottom Right -->
  <div class="absolute bottom-6 right-6 flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-lg z-50 text-slate-700">
    <button 
      onclick={zoomOut}
      class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
      title="Zoom Out"
    >
      <ZoomOut class="w-3.5 h-3.5" />
    </button>
    
    <button 
      onclick={zoomFit}
      class="text-xs text-slate-650 font-bold px-2 py-1 hover:bg-slate-100 rounded-md transition-all font-mono"
      title="Zoom to Fit"
    >
      {Math.round(config.zoom * 100)}%
    </button>
    
    <button 
      onclick={zoomIn}
      class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
      title="Zoom In"
    >
      <ZoomIn class="w-3.5 h-3.5" />
    </button>
  </div>

</div>
