import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PipelineBoard } from '@/components/pipeline/pipeline-board';
import { DEAL_STAGES } from '@/lib/utils';

export default async function PipelinePage() {
  const supabase = createServerSupabaseClient();

  const { data: deals } = await supabase
    .from('deals')
    .select('*, brand:brands(*), contact:contacts(*)')
    .eq('archived', false)
    .order('sort_order', { ascending: true });

  // Also fetch stats
  const { data: { user } } = await supabase.auth.getUser();
  let stats = null;
  if (user) {
    const { data } = await supabase.rpc('get_deal_stats', { p_user_id: user.id });
    stats = data;
  }

  const columns = DEAL_STAGES.map(stage => ({
    ...stage,
    deals: (deals || []).filter(d => d.status === stage.id),
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-midnight-800">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            {deals?.length || 0} active deals{stats ? ` · $${Number(stats.pipeline_value || 0).toLocaleString()} pipeline value` : ''}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <PipelineBoard initialColumns={columns} />
    </div>
  );
}
