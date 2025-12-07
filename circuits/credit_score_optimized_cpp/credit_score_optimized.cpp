#include <stdio.h>
#include <iostream>
#include <assert.h>
#include "circom.hpp"
#include "calcwit.hpp"
void CreditScoreProofOptimized_0_create(uint soffset,uint coffset,Circom_CalcWit* ctx,std::string componentName,uint componentFather);
void CreditScoreProofOptimized_0_run(uint ctx_index,Circom_CalcWit* ctx);
Circom_TemplateFunction _functionTable[1] = { 
CreditScoreProofOptimized_0_run };
Circom_TemplateFunction _functionTableParallel[1] = { 
NULL };
uint get_main_input_signal_start() {return 2;}

uint get_main_input_signal_no() {return 7;}

uint get_total_signal_no() {return 25;}

uint get_number_of_components() {return 1;}

uint get_size_of_input_hashmap() {return 256;}

uint get_size_of_witness() {return 24;}

uint get_size_of_constants() {return 5;}

uint get_size_of_io_map() {return 0;}

uint get_size_of_bus_field_map() {return 0;}

void release_memory_component(Circom_CalcWit* ctx, uint pos) {{

if (pos != 0){{

if(ctx->componentMemory[pos].subcomponents)
delete []ctx->componentMemory[pos].subcomponents;

if(ctx->componentMemory[pos].subcomponentsParallel)
delete []ctx->componentMemory[pos].subcomponentsParallel;

if(ctx->componentMemory[pos].outputIsSet)
delete []ctx->componentMemory[pos].outputIsSet;

if(ctx->componentMemory[pos].mutexes)
delete []ctx->componentMemory[pos].mutexes;

if(ctx->componentMemory[pos].cvs)
delete []ctx->componentMemory[pos].cvs;

if(ctx->componentMemory[pos].sbct)
delete []ctx->componentMemory[pos].sbct;

}}


}}


// function declarations
// template declarations
void CreditScoreProofOptimized_0_create(uint soffset,uint coffset,Circom_CalcWit* ctx,std::string componentName,uint componentFather){
ctx->componentMemory[coffset].templateId = 0;
ctx->componentMemory[coffset].templateName = "CreditScoreProofOptimized";
ctx->componentMemory[coffset].signalStart = soffset;
ctx->componentMemory[coffset].inputCounter = 7;
ctx->componentMemory[coffset].componentName = componentName;
ctx->componentMemory[coffset].idFather = componentFather;
ctx->componentMemory[coffset].subcomponents = new uint[0];
}

void CreditScoreProofOptimized_0_run(uint ctx_index,Circom_CalcWit* ctx){
FrElement* circuitConstants = ctx->circuitConstants;
FrElement* signalValues = ctx->signalValues;
FrElement expaux[2];
FrElement lvar[0];
u64 mySignalStart = ctx->componentMemory[ctx_index].signalStart;
std::string myTemplateName = ctx->componentMemory[ctx_index].templateName;
std::string myComponentName = ctx->componentMemory[ctx_index].componentName;
u64 myFather = ctx->componentMemory[ctx_index].idFather;
u64 myId = ctx_index;
u32* mySubcomponents = ctx->componentMemory[ctx_index].subcomponents;
bool* mySubcomponentsParallel = ctx->componentMemory[ctx_index].subcomponentsParallel;
std::string* listOfTemplateMessages = ctx->listOfTemplateMessages;
uint sub_component_aux;
uint index_multiple_eq;
int cmp_index_ref_load = -1;
{
PFrElement aux_dest = &signalValues[mySignalStart + 8];
// load src
Fr_sub(&expaux[0],&signalValues[mySignalStart + 3],&signalValues[mySignalStart + 1]); // line circom 40
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 9];
// load src
Fr_sub(&expaux[0],&signalValues[mySignalStart + 3],&circuitConstants[0]); // line circom 46
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 10];
// load src
Fr_sub(&expaux[0],&circuitConstants[1],&signalValues[mySignalStart + 3]); // line circom 47
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 11];
// load src
Fr_sub(&expaux[0],&signalValues[mySignalStart + 4],&circuitConstants[2]); // line circom 51
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 12];
// load src
Fr_sub(&expaux[0],&circuitConstants[3],&signalValues[mySignalStart + 5]); // line circom 55
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 13];
// load src
// end load src
Fr_copy(aux_dest,&signalValues[mySignalStart + 6]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 14];
// load src
Fr_mul(&expaux[0],&signalValues[mySignalStart + 8],&signalValues[mySignalStart + 8]); // line circom 69
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 15];
// load src
Fr_mul(&expaux[0],&signalValues[mySignalStart + 9],&signalValues[mySignalStart + 9]); // line circom 70
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 16];
// load src
Fr_mul(&expaux[0],&signalValues[mySignalStart + 10],&signalValues[mySignalStart + 10]); // line circom 71
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 17];
// load src
Fr_mul(&expaux[0],&signalValues[mySignalStart + 11],&signalValues[mySignalStart + 11]); // line circom 72
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 18];
// load src
Fr_mul(&expaux[0],&signalValues[mySignalStart + 12],&signalValues[mySignalStart + 12]); // line circom 73
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 19];
// load src
Fr_mul(&expaux[0],&signalValues[mySignalStart + 7],&signalValues[mySignalStart + 7]); // line circom 77
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 20];
// load src
Fr_mul(&expaux[0],&signalValues[mySignalStart + 13],&signalValues[mySignalStart + 13]); // line circom 81
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 0];
// load src
// end load src
Fr_copy(aux_dest,&circuitConstants[4]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 21];
// load src
Fr_add(&expaux[1],&signalValues[mySignalStart + 8],&signalValues[mySignalStart + 9]); // line circom 89
Fr_add(&expaux[0],&expaux[1],&signalValues[mySignalStart + 10]); // line circom 89
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 22];
// load src
Fr_add(&expaux[1],&signalValues[mySignalStart + 11],&signalValues[mySignalStart + 12]); // line circom 92
Fr_add(&expaux[0],&expaux[1],&signalValues[mySignalStart + 13]); // line circom 92
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
{
PFrElement aux_dest = &signalValues[mySignalStart + 23];
// load src
Fr_add(&expaux[0],&signalValues[mySignalStart + 21],&signalValues[mySignalStart + 22]); // line circom 96
// end load src
Fr_copy(aux_dest,&expaux[0]);
}
for (uint i = 0; i < 0; i++){
uint index_subc = ctx->componentMemory[ctx_index].subcomponents[i];
if (index_subc != 0){
assert(!(ctx->componentMemory[index_subc].inputCounter));
release_memory_component(ctx,index_subc);
}
}
}

void run(Circom_CalcWit* ctx){
CreditScoreProofOptimized_0_create(1,0,ctx,"main",0);
CreditScoreProofOptimized_0_run(0,ctx);
}

