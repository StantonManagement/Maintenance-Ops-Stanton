import { useState } from 'react';
import { useRules, Rule, RuleType, ruleFields } from '../hooks/useRules';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Settings2, 
  Search, 
  Plus, 
  RefreshCw,
  Play,
  Pause,
  Edit,
  Trash2,
  History,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
  GitBranch,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

export default function RulesPage() {
  const { 
    rules, 
    activeRules,
    rulesByType,
    loading, 
    refetch, 
    toggleRule,
    testRule
  } = useRules();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<RuleType | 'all'>('all');
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [testData, setTestData] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ matches: boolean; actions: any[] } | null>(null);

  const filteredRules = rules.filter(r => {
    const matchesSearch = searchQuery === '' || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: RuleType) => {
    const colors: Record<RuleType, string> = {
      priority: 'var(--status-critical-text)',
      assignment: 'var(--action-primary)',
      capacity: 'var(--status-warning-text)',
      notification: 'var(--status-info-text)',
      financial: 'var(--status-success-text)'
    };
    return (
      <Badge variant="outline" className="text-xs" style={{ borderColor: colors[type], color: colors[type] }}>
        {type}
      </Badge>
    );
  };

  const handleTest = async () => {
    if (!selectedRule) return;
    const result = await testRule(selectedRule, testData);
    setTestResult(result);
    toast.info(result.matches ? 'Rule would match!' : 'Rule would not match');
  };

  const totalFires = rules.reduce((sum, r) => sum + r.fire_count, 0);
  const totalOverrides = rules.reduce((sum, r) => sum + r.override_count, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--action-primary-light)' }}
          >
            <Settings2 size={24} style={{ color: 'var(--action-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Rules Engine
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {activeRules.length} active rules • {totalFires.toLocaleString()} total fires
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => toast.info('Rule creation coming soon')}>
            <Plus size={14} className="mr-1" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Rules List */}
        <div className="flex-1 overflow-hidden flex flex-col border-r" style={{ borderColor: 'var(--border-default)' }}>
          {/* Filters */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <Input 
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <Button
                  variant={typeFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                {(['priority', 'assignment', 'notification', 'financial'] as RuleType[]).map(type => (
                  <Button
                    key={type}
                    variant={typeFilter === type ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTypeFilter(type)}
                    className="h-7 text-xs capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Rules List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Settings2 size={48} style={{ color: 'var(--text-tertiary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No rules found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRules.map(rule => (
                  <Card 
                    key={rule.id} 
                    className={`cursor-pointer transition-all ${selectedRule?.id === rule.id ? 'ring-2' : ''}`}
                    style={{ 
                      borderColor: selectedRule?.id === rule.id ? 'var(--action-primary)' : undefined,
                      opacity: rule.is_active ? 1 : 0.6
                    }}
                    onClick={() => setSelectedRule(rule)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {rule.name}
                            </h3>
                            {getTypeBadge(rule.type)}
                            {!rule.is_active && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                            {rule.is_ab_test && (
                              <Badge variant="outline" className="text-xs">
                                <GitBranch size={10} className="mr-1" />
                                A/B Test
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {rule.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <span className="flex items-center gap-1">
                              <Zap size={12} />
                              {rule.fire_count} fires
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertTriangle size={12} />
                              {rule.override_count} overrides
                            </span>
                            <span>v{rule.version}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRule(rule.id);
                              toast.success(`Rule ${rule.is_active ? 'deactivated' : 'activated'}`);
                            }}
                          >
                            {rule.is_active ? <Pause size={14} /> : <Play size={14} />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info('Rule editor coming soon');
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rule Detail Panel */}
        <div className="w-[400px] overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {selectedRule ? (
            <div className="p-4">
              <Tabs defaultValue="details">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                  <TabsTrigger value="test" className="flex-1">Test</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{selectedRule.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                        {selectedRule.description}
                      </p>

                      {/* Conditions */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                          Conditions
                        </h4>
                        {selectedRule.condition_groups.map((group, gi) => (
                          <div key={group.id} className="mb-2">
                            {gi > 0 && (
                              <Badge variant="outline" className="mb-2 text-xs">{group.operator}</Badge>
                            )}
                            <div className="space-y-1 p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              {group.conditions.map((condition, ci) => (
                                <div key={condition.id} className="text-xs" style={{ color: 'var(--text-primary)' }}>
                                  {ci > 0 && <span className="text-amber-500 mr-1">{group.operator}</span>}
                                  <span className="font-medium">{condition.field}</span>
                                  <span className="mx-1" style={{ color: 'var(--text-tertiary)' }}>
                                    {condition.operator.replace('_', ' ')}
                                  </span>
                                  <span className="font-medium text-blue-500">"{condition.value}"</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                          Actions
                        </h4>
                        <div className="space-y-1">
                          {selectedRule.actions.map((action, i) => (
                            <div 
                              key={i} 
                              className="text-xs p-2 rounded flex items-center gap-2"
                              style={{ backgroundColor: 'var(--status-success-bg)' }}
                            >
                              <CheckCircle size={12} style={{ color: 'var(--status-success-text)' }} />
                              <span style={{ color: 'var(--text-primary)' }}>
                                {action.type.replace('_', ' ')}: <strong>{action.value}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            {selectedRule.fire_count}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Fires</p>
                        </div>
                        <div className="p-2 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            {selectedRule.override_count > 0 
                              ? `${Math.round((selectedRule.override_count / selectedRule.fire_count) * 100)}%`
                              : '0%'
                            }
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Override Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="test" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Test Rule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                        Enter sample data to test if this rule would match
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        {ruleFields.slice(0, 5).map(field => (
                          <div key={field.value}>
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {field.label}
                            </label>
                            <Input
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              value={testData[field.value] || ''}
                              onChange={(e) => setTestData(prev => ({ ...prev, [field.value]: e.target.value }))}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <Button className="w-full" onClick={handleTest}>
                        <Play size={14} className="mr-1" />
                        Test Rule
                      </Button>

                      {testResult && (
                        <div 
                          className="mt-3 p-3 rounded"
                          style={{ 
                            backgroundColor: testResult.matches 
                              ? 'var(--status-success-bg)' 
                              : 'var(--status-critical-bg)'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {testResult.matches ? (
                              <CheckCircle size={16} style={{ color: 'var(--status-success-text)' }} />
                            ) : (
                              <AlertTriangle size={16} style={{ color: 'var(--status-critical-text)' }} />
                            )}
                            <span className="text-sm font-medium" style={{ 
                              color: testResult.matches 
                                ? 'var(--status-success-text)' 
                                : 'var(--status-critical-text)' 
                            }}>
                              {testResult.matches ? 'Rule Matches!' : 'No Match'}
                            </span>
                          </div>
                          {testResult.matches && testResult.actions.length > 0 && (
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              Actions: {testResult.actions.map(a => a.type).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Version History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--action-primary)' }} />
                            <div className="w-0.5 flex-1" style={{ backgroundColor: 'var(--border-default)' }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                v{selectedRule.version} (Current)
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {new Date(selectedRule.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              By {selectedRule.created_by}
                            </p>
                          </div>
                        </div>
                        
                        {selectedRule.version > 1 && (
                          <div className="flex items-start gap-3 p-2 rounded opacity-60">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-tertiary)' }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                  v{selectedRule.version - 1}
                                </span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs">
                                  <History size={12} className="mr-1" />
                                  Rollback
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
              <Settings2 size={48} style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Select a rule to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
