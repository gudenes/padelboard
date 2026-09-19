import { beforeEach, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({user:null as null | {id:string;user_metadata:object},row:{id:"11111111-1111-4111-8111-111111111111",short_code:"PHONE1",status:"published",owner_id:"owner"}}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error(`redirect:${url}`)},notFound:()=>{throw new Error("notFound")}}));
vi.mock("@/lib/supabase-server",()=>({serviceSupabase:()=>({from:()=>({select:()=>({eq:()=>({single:async()=>({data:state.row})})})})}),serverSupabase:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}})}));
vi.mock("@/components/workspace/ReadyMatch",()=>({ReadyMatch:()=>null}));
vi.mock("@/app/m/[code]/Operator",()=>({Operator:()=>null}));
import MatchPage from "@/app/m/[code]/page";
beforeEach(()=>{state.user=null;});
it("preserves the exact match through phone login",async()=>{
 await expect(MatchPage({params:Promise.resolve({code:"PHONE1"})})).rejects.toThrow(`redirect:/login?match=${state.row.id}`);
});
it("does not grant control to a different signed-in account",async()=>{
 state.user={id:"someone-else",user_metadata:{padelboard_profile:{completed:true}}};
 await expect(MatchPage({params:Promise.resolve({code:"PHONE1"})})).rejects.toThrow("notFound");
});
