#!/usr/bin/env python3
# CoreTrust Fit v3 scoring engine. Run: python3 fitv3_engine.py MEMBER_SFDC.xlsx FREIGHT.csv
# Fit v3 = 30% freight opportunity + 30% engrainment + 15% intensity + 15% actionability + 10% warmth
import sys, re, math
TRANSPORT_PCT={'distribution':.075,'wholesale':.075,'building materials':.075,'food':.055,'beverage':.055,'consumer':.055,'manufacturing':.06,'chemicals':.06,'industrial':.06,'automotive':.06,'aerospace':.06,'machinery':.06,'retail':.045,'agriculture':.05,'construction':.04,'healthcare':.02,'electronics':.05,'apparel':.05}
INTENSITY={'wholesale':100,'distribution':100,'food':98,'beverage':95,'building materials':97,'manufacturing':95,'chemicals':92,'consumer':90,'agriculture':88,'automotive':90,'machinery':88,'industrial':88,'aerospace':82,'retail':80,'apparel':78,'electronics':75,'construction':70,'pharma':55,'healthcare':45,'business services':15,'finance':5,'software':2,'k-12':0}
def norm(s):
    if not isinstance(s,str): return ''
    # d/b/a, d.b.a., and dba all mean "doing business as" -- drop everything from there on
    # so a legal-entity SFDC name and its trade name dedup to the same key.
    s=re.sub(r'\bd[.\s]?[/.]?\s?b[.\s]?[/.]?\s?a\b.*','',s.lower())
    s=re.sub(r'\b(inc|llc|ltd|corp|corporation|co|company|holdings|group|the)\b','',s); return re.sub(r'[^a-z0-9]','',s)
def look(d,i,s,dv):
    for k in (str(s).lower(),str(i).lower()):
        for t,v in d.items():
            if t in k: return v
    return dv
def fo(ef):
    if not ef or ef<=0: return None
    return max(0,min(100,60+(math.log10(max(ef,1e4))-7)*20))
def action(email,title):
    lg=['logistics','supply chain','transportation','distribution','freight','operations','procurement']
    if email and '@' in str(email):
        if any(x in str(title).lower() for x in lg): return 100
        if title: return 75
        return 60
    return 40 if title else 0
def score(rev,emp,ind,sub,ttm_pct,opp_pct,email,title,pe,has_ae,est=None):
    if (not rev or rev<=0) and emp and emp>0: rev=emp*250000
    ef=est if est else (rev*look(TRANSPORT_PCT,ind,sub,.008) if rev else None)
    fi=look(INTENSITY,ind,sub,8); fo_v=fo(ef); fofin=fo_v if fo_v is not None else fi*.5
    eng=.85*ttm_pct+.10*opp_pct+.05*(100 if ttm_pct>0 else 0)
    act=action(email,title); wm=(60 if pe and str(pe).lower()!='independent' else 0)+(40 if has_ae else 0)
    fit=round(.30*fofin+.30*eng+.15*fi+.15*act+.10*wm,1)
    tier='A' if fit>=70 else 'B' if fit>=55 else 'C' if fit>=40 else 'D'
    return dict(est_freight=ef,fo=round(fofin,1),eng=round(eng,1),fi=fi,act=act,wm=wm,fit=fit,tier=tier)
if __name__=='__main__':
    if len(sys.argv)>=3:
        import pandas as pd
        mem=pd.read_excel(sys.argv[1]); fl=pd.read_csv(sys.argv[2])
        # (full merge + percentile scoring; see build_master for the complete pipeline)
        print('Engine ready. Load member + freight files, compute TTM/opp percentiles, call score() per row.')
    else:
        print('Fit v3 engine loaded. Weights: 30/30/15/15/10. Tiers A>=70 B>=55 C>=40 D.')
