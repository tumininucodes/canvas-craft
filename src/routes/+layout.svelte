<script lang="ts">
  import './layout.css';
  import { Sparkles } from '@lucide/svelte';

  let { children } = $props();
</script>

<svelte:head>
  <title>CanvasCraft — Free Online Graphic Design Tool Alternative</title>
  <meta name="description" content="CanvasCraft is an open-source graphic design editor built on SvelteKit and Tailwind CSS. Create posts, shapes, text designs, and drawings, then export them instantly." />
  <meta name="keywords" content="canva alternative, graphic design, open source editor, sveltekit canvas, tailwind css v4" />
</svelte:head>

<div class="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col antialiased">
  {@render children()}
</div>
