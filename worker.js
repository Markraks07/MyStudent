export default {
  async fetch(request) {
    try {
      const { messages } = await request.json();

      const response = await ai.run(
        "@cf/meta/llama-3.2-3b-instruct",   // Modelo gratis
        { messages }
      );

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" }
      });
      
    } catch (err) {
      return new Response(JSON.stringify({ error: err.toString() }), {
        status: 500
      });
    }
  }
};
