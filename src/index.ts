import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { supabase } from "./lib/supabase";

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'IoT Smart Humidifier API',
        version: '1.0.0',
        description: 'API documentation for IoT Smart Humidifier project'
      }
    }
  }))
  .get("/", () => "IoT Smart Humidifier API")

  // Celcius Endpoints
  .post("/celcius", async ({ body, set }) => {
    const { error } = await supabase.from("celcius").insert(body);
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return { success: true };
  }, {
    body: t.Object({
      degrees: t.Integer(),
    }),
    response: {
      200: t.Object({ success: t.Boolean() }),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Create new temperature reading' }
  })
  .get("/celcius", async ({ set }) => {
    const { data, error } = await supabase.from("celcius").select("*").order("created_at", { ascending: false });
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return data;
  }, {
    response: {
      200: t.Array(t.Object({
        id: t.Number(),
        degrees: t.Integer(),
        created_at: t.String()
      })),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Get all temperature readings' }
  })
  .delete("/celcius/:id", async ({ params: { id }, set }) => {
    const { error } = await supabase.from("celcius").delete().eq("id", id);
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return { success: true };
  }, {
    response: {
      200: t.Object({ success: t.Boolean() }),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Delete temperature reading' }
  })

  // Humidity Endpoints
  .post("/humidity", async ({ body, set }) => {
    const { error } = await supabase.from("humidity").insert(body);
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return { success: true };
  }, {
    body: t.Object({
      percent: t.Integer(),
    }),
    response: {
      200: t.Object({ success: t.Boolean() }),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Create new humidity reading' }
  })
  .get("/humidity", async ({ set }) => {
    const { data, error } = await supabase.from("humidity").select("*").order("created_at", { ascending: false });
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return data;
  }, {
    response: {
      200: t.Array(t.Object({
        id: t.Number(),
        percent: t.Integer(),
        created_at: t.String()
      })),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Get all humidity readings' }
  })
  .delete("/humidity/:id", async ({ params: { id }, set }) => {
    const { error } = await supabase.from("humidity").delete().eq("id", id);
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return { success: true };
  }, {
    response: {
      200: t.Object({ success: t.Boolean() }),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Delete humidity reading' }
  })

  // Relay Endpoints
  .post("/relay", async ({ body, set }) => {
    const { error } = await supabase.from("relay").insert(body);
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return { success: true };
  }, {
    body: t.Object({
      reported_status: t.Union([t.Literal("ON"), t.Literal("OFF")]),
      mode: t.Union([t.Literal("AUTO"), t.Literal("MANUAL")]),
      manual_since: t.Optional(t.String()),
    }),
    response: {
      200: t.Object({ success: t.Boolean() }),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Create new relay state' }
  })
  .get("/relay", async ({ set }) => {
    const { data, error } = await supabase.from("relay").select("*").order("updated_at", { ascending: false });
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return data;
  }, {
    response: {
      200: t.Array(t.Object({
        id: t.Number(),
        reported_status: t.Union([t.Literal("ON"), t.Literal("OFF")]),
        mode: t.Union([t.Literal("AUTO"), t.Literal("MANUAL")]),
        manual_since: t.Union([t.String(), t.Null()]),
        updated_at: t.String()
      })),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Get all relay states' }
  })
  .patch("/relay/:id", async ({ params: { id }, body, set }) => {
    const { error } = await supabase.from("relay").update({ ...body, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      set.status = 500;
      return { error: error.message };
    }
    return { success: true };
  }, {
    body: t.Object({
      reported_status: t.Optional(t.Union([t.Literal("ON"), t.Literal("OFF")])),
      mode: t.Optional(t.Union([t.Literal("AUTO"), t.Literal("MANUAL")])),
      manual_since: t.Optional(t.String()),
    }),
    response: {
      200: t.Object({ success: t.Boolean() }),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Update relay state' }
  })

  // Statistics Endpoint
  .get("/statistik", async ({ set }) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch data
    const [celciusRes, humidityRes] = await Promise.all([
      supabase.from("celcius").select("*").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
      supabase.from("humidity").select("*").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true })
    ]);

    if (celciusRes.error || humidityRes.error) {
      set.status = 500;
      return { error: celciusRes.error?.message || humidityRes.error?.message };
    }

    const processData = (data: any[], valueKey: string) => {
      const daily: Record<string, { sum: number; count: number }> = {}; // Hourly buckets for last 24h
      const weekly: Record<string, { sum: number; count: number }> = {}; // Daily buckets for last 7d
      const monthly: Record<string, { sum: number; count: number }> = {}; // Daily buckets for last 30d

      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      data.forEach(item => {
        const date = new Date(item.created_at);
        const val = item[valueKey];

        // Monthly (Last 30 Days) - Group by Day
        const dayKey = date.toISOString().split('T')[0];
        if (!monthly[dayKey]) monthly[dayKey] = { sum: 0, count: 0 };
        monthly[dayKey].sum += val;
        monthly[dayKey].count++;

        // Weekly (Last 7 Days) - Group by Day
        if (date >= sevenDaysAgo) {
          if (!weekly[dayKey]) weekly[dayKey] = { sum: 0, count: 0 };
          weekly[dayKey].sum += val;
          weekly[dayKey].count++;
        }

        // Daily (Last 24 Hours) - Group by Hour
        if (date >= oneDayAgo) {
          const hourKey = date.toISOString().slice(0, 13) + ":00:00.000Z"; // YYYY-MM-DDTHH:00...
          if (!daily[hourKey]) daily[hourKey] = { sum: 0, count: 0 };
          daily[hourKey].sum += val;
          daily[hourKey].count++;
        }
      });

      const average = (record: Record<string, { sum: number; count: number }>) => 
        Object.entries(record).map(([key, { sum, count }]) => ({ time: key, value: sum / count }));

      return {
        daily: average(daily),
        weekly: average(weekly),
        monthly: average(monthly)
      };
    };

    return {
      celcius: processData(celciusRes.data, "degrees"),
      humidity: processData(humidityRes.data, "percent")
    };
  }, {
    response: {
      200: t.Object({
        celcius: t.Object({
          daily: t.Array(t.Object({ time: t.String(), value: t.Number() })),
          weekly: t.Array(t.Object({ time: t.String(), value: t.Number() })),
          monthly: t.Array(t.Object({ time: t.String(), value: t.Number() }))
        }),
        humidity: t.Object({
          daily: t.Array(t.Object({ time: t.String(), value: t.Number() })),
          weekly: t.Array(t.Object({ time: t.String(), value: t.Number() })),
          monthly: t.Array(t.Object({ time: t.String(), value: t.Number() }))
        })
      }),
      500: t.Object({ error: t.String() })
    },
    detail: { summary: 'Get aggregated statistics' }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
