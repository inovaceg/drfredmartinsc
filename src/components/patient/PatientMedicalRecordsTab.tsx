"use client";

import React from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";

type MedicalRecord = Tables<'medical_records'>;

export function PatientMedicalRecordsTab() {
  const { user } = useUser();
  const currentUserId = user?.id;

  const {
    data: patientMedicalRecords,
    isLoading,
    isError,
    error,
  } = useQuery<MedicalRecord[], Error>({
    queryKey: ["patientMedicalRecords", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2<dyad-problem-report summary="61 problems">
<problem file="src/pages/Index.tsx" line="4" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' has no default export. Did you mean to use 'import { Footer } from &quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' instead?</problem>
<problem file="src/pages/Index.tsx" line="11" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/components/ContactSection&quot;' has no default export. Did you mean to use 'import { ContactSection } from &quot;C:/Users/felip/dyad-apps/certissimo/src/components/ContactSection&quot;' instead?</problem>
<problem file="src/pages/Shop.tsx" line="26" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' has no default export. Did you mean to use 'import { Footer } from &quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' instead?</problem>
<problem file="src/pages/Licensee.tsx" line="5" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' has no default export. Did you mean to use 'import { Footer } from &quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' instead?</problem>
<problem file="src/pages/Owners.tsx" line="5" column="25" code="2307">Cannot find module '@/hooks/useUser' or its corresponding type declarations.</problem>
<problem file="src/pages/ReturnsPolicy.tsx" line="2" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' has no default export. Did you mean to use 'import { Footer } from &quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' instead?</problem>
<problem file="src/pages/Auth.tsx" line="3" column="22" code="2307">Cannot find module '@supabase/auth-ui-react' or its corresponding type declarations.</problem>
<problem file="src/pages/Auth.tsx" line="4" column="27" code="2307">Cannot find module '@supabase/auth-ui-shared' or its corresponding type declarations.</problem>
<problem file="src/pages/Auth.tsx" line="8" column="25" code="2307">Cannot find module '@/hooks/useUser' or its corresponding type declarations.</problem>
<problem file="src/components/ChatWindow.tsx" line="5" column="25" code="2307">Cannot find module '@/hooks/useUser' or its corresponding type declarations.</problem>
<problem file="src/components/ChatWindow.tsx" line="164" column="24" code="2304">Cannot find name 'cn'.</problem>
<problem file="src/components/ChatWindow.tsx" line="170" column="26" code="2304">Cannot find name 'cn'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="5" column="25" code="2307">Cannot find module '@/hooks/useUser' or its corresponding type declarations.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="85" column="15" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="117" column="19" code="2339">Property 'data' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="117" column="38" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="131" column="19" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="134" column="62" code="2552">Cannot find name 'Json'. Did you mean 'JSON'?</problem>
<problem file="src/components/VideoCallWindow.tsx" line="154" column="15" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="157" column="71" code="2552">Cannot find name 'Json'. Did you mean 'JSON'?</problem>
<problem file="src/components/VideoCallWindow.tsx" line="178" column="15" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="181" column="73" code="2552">Cannot find name 'Json'. Did you mean 'JSON'?</problem>
<problem file="src/components/VideoCallWindow.tsx" line="207" column="15" code="2339">Property 'data' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="207" column="38" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="240" column="19" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="289" column="90" code="2352">Conversion of type 'string | number | boolean | { [key: string]: Json; } | Json[]' to type 'RTCSessionDescriptionInit' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'type' is missing in type 'Json[]' but required in type 'RTCSessionDescriptionInit'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="291" column="45" code="2352">Conversion of type 'string | number | boolean | { [key: string]: Json; } | Json[]' to type 'RTCSessionDescriptionInit' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'type' is missing in type 'Json[]' but required in type 'RTCSessionDescriptionInit'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="296" column="90" code="2352">Conversion of type 'string | number | boolean | { [key: string]: Json; } | Json[]' to type 'RTCSessionDescriptionInit' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'type' is missing in type 'Json[]' but required in type 'RTCSessionDescriptionInit'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="301" column="78" code="2339">Property 'length' does not exist on type 'string | number | true | { [key: string]: Json; } | Json[]'.
  Property 'length' does not exist on type 'number'.</problem>
<problem file="src/components/VideoCallWindow.tsx" line="302" column="125" code="2339">Property 'iceCandidates' does not exist on type 'RTCSessionDescription'.</problem>
<problem file="src/components/OnlineConsultationTab.tsx" line="107" column="11" code="2322">Type '{ currentUserId: string; otherUserId: string; isDoctor: boolean; }' is not assignable to type 'IntrinsicAttributes &amp; ChatWindowProps'.
  Property 'currentUserId' does not exist on type 'IntrinsicAttributes &amp; ChatWindowProps'.</problem>
<problem file="src/components/OnlineConsultationTab.tsx" line="122" column="11" code="2322">Type '{ currentUserId: string; otherUserId: string; isInitiator: boolean; onEndCall: () =&gt; void; initialSessionId: string; }' is not assignable to type 'IntrinsicAttributes &amp; VideoCallWindowProps'.
  Property 'currentUserId' does not exist on type 'IntrinsicAttributes &amp; VideoCallWindowProps'.</problem>
<problem file="src/pages/PatientDocumentsPage.tsx" line="5" column="25" code="2307">Cannot find module '@/hooks/useUser' or its corresponding type declarations.</problem>
<problem file="src/components/patient/PatientScheduleTab.tsx" line="5" column="25" code="2307">Cannot find module '@/hooks/useUser' or its corresponding type declarations.</problem>
<problem file="src/components/patient/PatientAppointmentsTab.tsx" line="5" column="25" code="2307">Cannot find module '@/hooks/useUser' or its corresponding type declarations.</problem>
<problem file="src/pages/Patient.tsx" line="9" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' has no default export. Did you mean to use 'import { Footer } from &quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' instead?</problem>
<problem file="src/pages/Patient.tsx" line="12" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/pages/PatientDocumentsPage&quot;' has no default export. Did you mean to use 'import { PatientDocumentsPage } from &quot;C:/Users/felip/dyad-apps/certissimo/src/pages/PatientDocumentsPage&quot;' instead?</problem>
<problem file="src/pages/Patient.tsx" line="249" column="15" code="2322">Type '{ user: User; onAppointmentsChanged: () =&gt; void; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'user' does not exist on type 'IntrinsicAttributes'.</problem>
<problem file="src/components/doctor/DoctorMedicalRecordsTab.tsx" line="101" column="5" code="2769">No overload matches this call.
  Overload 1 of 3, '(options: DefinedInitialDataOptions&lt;unknown, Error, unknown, string[]&gt;, queryClient?: QueryClient): DefinedUseQueryResult&lt;unknown, Error&gt;', gave the following error.
    Object literal may only specify known properties, and 'onSuccess' does not exist in type 'DefinedInitialDataOptions&lt;unknown, Error, unknown, string[]&gt;'.
  Overload 2 of 3, '(options: UndefinedInitialDataOptions&lt;{ avatar_url: string; birth_date: string; city: string; consent_date: string; consent_status: boolean; created_at: string; current_medications: string; email: string; full_name: string; ... 17 more ...; zip_code: string; }[], Error, { ...; }[], string[]&gt;, queryClient?: QueryClient): UseQueryResult&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'onSuccess' does not exist in type 'UndefinedInitialDataOptions&lt;{ avatar_url: string; birth_date: string; city: string; consent_date: string; consent_status: boolean; created_at: string; current_medications: string; email: string; full_name: string; id: string; ... 16 more ...; zip_code: string; }[], Error, { ...; }[], string[]&gt;'.
  Overload 3 of 3, '(options: UseQueryOptions&lt;{ avatar_url: string; birth_date: string; city: string; consent_date: string; consent_status: boolean; created_at: string; current_medications: string; email: string; full_name: string; ... 17 more ...; zip_code: string; }[], Error, { ...; }[], string[]&gt;, queryClient?: QueryClient): UseQueryResult&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'onSuccess' does not exist in type 'UseQueryOptions&lt;{ avatar_url: string; birth_date: string; city: string; consent_date: string; consent_status: boolean; created_at: string; current_medications: string; email: string; full_name: string; id: string; ... 16 more ...; zip_code: string; }[], Error, { ...; }[], string[]&gt;'.</problem>
<problem file="src/components/doctor/DoctorMedicalRecordsTab.tsx" line="439" column="111" code="2339">Property 'length' does not exist on type 'unknown'.</problem>
<problem file="src/components/doctor/DoctorMedicalRecordsTab.tsx" line="442" column="26" code="2339">Property 'map' does not exist on type 'unknown'.</problem>
<problem file="src/components/DoctorOnlineConsultationTab.tsx" line="173" column="11" code="2322">Type '{ currentUserId: string; otherUserId: string; appointmentId: any; isDoctor: boolean; }' is not assignable to type 'IntrinsicAttributes &amp; ChatWindowProps'.
  Property 'currentUserId' does not exist on type 'IntrinsicAttributes &amp; ChatWindowProps'.</problem>
<problem file="src/components/DoctorOnlineConsultationTab.tsx" line="175" column="42" code="2339">Property 'appointment_id' does not exist on type 'ActiveSession'.</problem>
<problem file="src/components/DoctorOnlineConsultationTab.tsx" line="189" column="11" code="2322">Type '{ currentUserId: string; otherUserId: string; isInitiator: boolean; onEndCall: () =&gt; void; initialSessionId: string; incomingOffer: any; }' is not assignable to type 'IntrinsicAttributes &amp; VideoCallWindowProps'.
  Property 'currentUserId' does not exist on type 'IntrinsicAttributes &amp; VideoCallWindowProps'.</problem>
<problem file="src/components/doctor/DoctorNewsletterSubscriptionsTab.tsx" line="7" column="27" code="2307">Cannot find module '@/components/ui/data-table' or its corresponding type declarations.</problem>
<problem file="src/components/doctor/DoctorNewsletterSubscriptionsTab.tsx" line="8" column="27" code="2307">Cannot find module '@tanstack/react-table' or its corresponding type declarations.</problem>
<problem file="src/pages/Doctor.tsx" line="12" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' has no default export. Did you mean to use 'import { Footer } from &quot;C:/Users/felip/dyad-apps/certissimo/src/components/Footer&quot;' instead?</problem>
<problem file="src/pages/Doctor.tsx" line="56" column="10" code="2305">Module '&quot;@/lib/supabase-queries&quot;' has no exported member 'fetchSlotsData'.</problem>
<problem file="src/pages/Doctor.tsx" line="187" column="24" code="2352">Conversion of type '{ full_name: any; }[]' to type '{ full_name: string; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Property 'full_name' is missing in type '{ full_name: any; }[]' but required in type '{ full_name: string; }'.</problem>
<problem file="src/App.tsx" line="10" column="8" code="2613">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/pages/Owners&quot;' has no default export. Did you mean to use 'import { Owners } from &quot;C:/Users/felip/dyad-apps/certissimo/src/pages/Owners&quot;' instead?</problem>
<problem file="src/App.tsx" line="19" column="8" code="1192">Module '&quot;C:/Users/felip/dyad-apps/certissimo/src/pages/Auth&quot;' has no default export.</problem>
<problem file="src/components/ErrorBoundary.tsx" line="43" column="12" code="2304">Cannot find name 'Button'.</problem>
<problem file="src/components/ErrorBoundary.tsx" line="45" column="13" code="2304">Cannot find name 'Button'.</problem>
<problem file="src/components/DocumentUploadForm.tsx" line="69" column="10" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: &quot;exact&quot; | &quot;planned&quot; | &quot;estimated&quot;; }): PostgrestFilterBuilder&lt;{ PostgrestVersion: &quot;12&quot;; }, never, never, null, &quot;documents&quot;, never, &quot;POST&quot;&gt;', gave the following error.
    Argument of type '{ patient_id: string; doctor_id: string; file_name: string; file_path: string; description: string; uploaded_at: string; file_type: string; file_size: number; }' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: &quot;exact&quot; | &quot;planned&quot; | &quot;estimated&quot;; defaultToNull?: boolean; }): PostgrestFilterBuilder&lt;{ PostgrestVersion: &quot;12&quot;; }, never, never, null, &quot;documents&quot;, never, &quot;POST&quot;&gt;', gave the following error.
    Object literal may only specify known properties, and 'patient_id' does not exist in type 'never[]'.</problem>
<problem file="src/pages/PatientScheduleTab.tsx" line="36" column="10" code="2305">Module '&quot;@/lib/supabase-queries&quot;' has no exported member 'fetchSlotsData'.</problem>
<problem file="src/pages/PatientScheduleTab.tsx" line="54" column="17" code="2339">Property 'data' does not exist on type '{}'.</problem>
<problem file="src/pages/PatientScheduleTab.tsx" line="54" column="23" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/pages/PatientScheduleTab.tsx" line="84" column="17" code="2339">Property 'data' does not exist on type '{}'.</problem>
<problem file="src/pages/PatientScheduleTab.tsx" line="84" column="23" code="2339">Property 'error' does not exist on type '{}'.</problem>
<problem file="src/pages/PatientScheduleTab.tsx" line="182" column="15" code="2339">Property 'data' does not exist on type '{}'.</problem>
<problem file="src/pages/PatientScheduleTab.tsx" line="182" column="21" code="2339">Property 'error' does not exist on type '{}'.</problem>
</dyad-problem-report>Com certeza! Parece que temos uma nova leva de erros de compilação, principalmente relacionados a:

1.  **Importações de módulos com `default export` vs. `named export`**: Muitos componentes que você está importando como `default` (ex: `import Footer from ...`) na verdade são `named exports` (ex: `export function Footer() { ... }`).
2.  **Módulos não encontrados**: Alguns módulos como `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`, `@tanstack/react-table`, `DataTable`, `useUser` e `cn` não estão sendo encontrados. Isso pode ser devido a dependências não instaladas ou caminhos de importação incorretos.
3.  **Tipagem incorreta em chamadas Supabase RPC e `Promise.race`**: O TypeScript está reclamando que `data` e `error` não existem em objetos retornados por `Promise.race` ou que os tipos de argumentos não correspondem.
4.  **Propriedades ausentes em componentes**: Componentes como `ChatWindow` e `VideoCallWindow` estão recebendo props que não foram definidas em suas interfaces.
5.  **Acesso a propriedades de `Json`**: O tipo `Json` do Supabase é genérico e precisa ser explicitamente convertido para um tipo mais específico ao acessar suas propriedades, como `ice_candidates`.
6.  **`fetchSlotsData` não exportado**: A função `fetchSlotsData` não está sendo exportada de `src/lib/supabase-queries.ts`.
7.  **`Button` não importado em `ErrorBoundary.tsx`**.

Vamos corrigir esses erros.

Primeiro, vou garantir que todas as dependências necessárias estejam instaladas.

<dyad-add-dependency packages="@supabase/auth-ui-react @supabase/auth-ui-shared @tanstack/react-table"></dyad-add-dependency>

Agora, vou aplicar as correções nos arquivos:

<dyad-write path="src/pages/Index.tsx" description="Corrigindo importações de componentes.">
"use client";

import HeroSection from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import StorySection from "@/components/StorySection"; // Reutilizando
import { FaqSection } from "@/components/FaqSection"; // Novo
import { ContactSection } from "@/components/ContactSection"; // Novo
import { useEffect } from "react"; // Import useEffect
import { useLocation } from "react-router-dom"; // Import useLocation

export default function Index() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <>
      <HeroSection />
      <StorySection />
      <FaqSection />
      <ContactSection />
      <Footer />
    </>
  );
}